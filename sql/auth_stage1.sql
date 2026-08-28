-- ============================================================================
--  1단계 — 비밀번호를 브라우저에서 걷어낸다
--  Supabase SQL Editor 에 통째로 붙여넣고 Run.
--
--  지금 상태:  users 표에 비밀번호가 그냥 글자로 들어 있고, 로그인 화면이 뜨기 전에
--              브라우저가 그 표를 통째로 내려받는다. F12 → 네트워크 탭만 열면
--              전 직원 아이디·비밀번호가 그대로 보인다. 해킹이 필요 없다.
--
--  이 스크립트가 하는 일:
--    1) user_secrets 표를 새로 만들고 비밀번호를 bcrypt 로 해시해서 옮긴다.
--       (이 표는 anon 키로 한 줄도 못 읽는다)
--    2) 비밀번호 확인·변경을 서버 함수(RPC)로 옮긴다.
--    3) 로그인 시도 횟수를 제한한다. (10분에 30번)
--
--  ★ 이 스크립트만으로는 아무것도 깨지지 않는다.
--    users.password 칼럼은 그대로 두기 때문에 예전 코드도 계속 돌아간다.
--    전 분원이 새 코드로 로그인되는 걸 확인한 다음에
--    sql/auth_stage2_drop_password.sql 을 돌려서 칼럼을 없앤다.
--
--  되돌리기: 이 파일 맨 아래 '되돌리기' 주석 참고.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ── 1. 비밀번호 보관소 ───────────────────────────────────────────────────────
create table if not exists public.user_secrets (
  user_id      text primary key,
  pw_hash      text not null,
  legacy_plain text,                                   -- 되돌리기용. 2단계에서 지운다
  updated_at   timestamptz not null default now()
);

-- RLS 켜고 정책은 하나도 안 만든다 = anon / authenticated 는 한 줄도 못 본다
alter table public.user_secrets enable row level security;
revoke all on public.user_secrets from anon, authenticated, public;

-- ── 2. 로그인 시도 제한 ─────────────────────────────────────────────────────
create table if not exists public.jls_login_throttle (
  login     text primary key,
  fails     int not null default 0,
  last_fail timestamptz
);
alter table public.jls_login_throttle enable row level security;
revoke all on public.jls_login_throttle from anon, authenticated, public;

-- ── 3. 기존 비밀번호를 해시로 옮긴다 ────────────────────────────────────────
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema='public' and table_name='users' and column_name='password') then
    execute $q$
      insert into public.user_secrets(user_id, pw_hash, legacy_plain)
      select u.id::text,
             extensions.crypt(coalesce(u.password,''), extensions.gen_salt('bf')),
             u.password
        from public.users u
       where u.id is not null
      on conflict (user_id) do nothing
    $q$;
  end if;
end $$;

-- ── 4. 서버 함수 ────────────────────────────────────────────────────────────

-- 실패 카운터 (내부용)
create or replace function public.jls_note_fail(p_login text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.jls_login_throttle(login, fails, last_fail)
  values (p_login, 1, now())
  on conflict (login) do update
     set fails = case when public.jls_login_throttle.last_fail > now() - interval '10 minutes'
                      then public.jls_login_throttle.fails + 1 else 1 end,
         last_fail = now();
exception when others then
  null;   -- 카운터가 고장나도 로그인 자체는 막지 않는다
end $$;
revoke execute on function public.jls_note_fail(text) from anon, authenticated, public;

-- 비밀번호 대조 (내부용). 맞으면 user_id, 틀리면 null
create or replace function public.jls_check(p_login text, p_password text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_row jsonb; v_id text; v_hash text;
begin
  if p_login is null or p_password is null then return null; end if;

  select to_jsonb(u) into v_row
    from public.users u
   where u.username = p_login or u.id::text = p_login
   limit 1;
  if v_row is null then return null; end if;

  v_id := v_row->>'id';
  select pw_hash into v_hash from public.user_secrets where user_id = v_id;

  -- 아직 해시가 없는 계정(스크립트 돌린 뒤에 만들어진 계정)은 평문 칼럼으로 한 번만 봐준다
  if v_hash is null then
    if coalesce(v_row->>'password','') <> '' and v_row->>'password' = p_password then
      insert into public.user_secrets(user_id, pw_hash, legacy_plain)
      values (v_id, extensions.crypt(p_password, extensions.gen_salt('bf')), p_password)
      on conflict (user_id) do nothing;
      return v_id;
    end if;
    return null;
  end if;

  if v_hash = extensions.crypt(p_password, v_hash) then return v_id; end if;
  return null;
end $$;
revoke execute on function public.jls_check(text, text) from anon, authenticated, public;

-- 해시 저장 (내부용). users.password 칼럼이 아직 있으면 같이 맞춰준다
create or replace function public.jls_store(p_user_id text, p_new text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.user_secrets(user_id, pw_hash, legacy_plain, updated_at)
  values (p_user_id, extensions.crypt(p_new, extensions.gen_salt('bf')), null, now())
  on conflict (user_id) do update
     set pw_hash = excluded.pw_hash, legacy_plain = null, updated_at = now();

  -- 2단계 전까지는 예전 코드도 같은 비밀번호로 들어올 수 있어야 한다
  if exists (select 1 from information_schema.columns
              where table_schema='public' and table_name='users' and column_name='password') then
    execute 'update public.users set password = $1 where id::text = $2' using p_new, p_user_id;
  end if;
end $$;
revoke execute on function public.jls_store(text, text) from anon, authenticated, public;

-- ── 로그인 ──────────────────────────────────────────────────────────────────
create or replace function public.jls_login(p_login text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_fails int; v_id text; v_row jsonb;
begin
  select fails into v_fails
    from public.jls_login_throttle
   where login = p_login and last_fail > now() - interval '10 minutes';
  if coalesce(v_fails, 0) >= 30 then
    raise exception '로그인 시도가 너무 많습니다. 10분 뒤에 다시 시도하세요.';
  end if;

  v_id := public.jls_check(p_login, p_password);
  if v_id is null then
    perform public.jls_note_fail(p_login);
    return null;
  end if;

  delete from public.jls_login_throttle where login = p_login;

  select to_jsonb(u) into v_row from public.users u where u.id::text = v_id;
  return (v_row - 'password');
end $$;
grant execute on function public.jls_login(text, text) to anon, authenticated;

-- ── 내 비밀번호 변경 (현재 비밀번호를 알아야 한다) ──────────────────────────
create or replace function public.jls_change_password(p_login text, p_old text, p_new text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_id text;
begin
  if p_new is null or length(p_new) < 4 then
    raise exception '새 비밀번호는 4자 이상이어야 합니다.';
  end if;
  v_id := public.jls_check(p_login, p_old);
  if v_id is null then
    perform public.jls_note_fail(p_login);
    raise exception '현재 비밀번호가 올바르지 않습니다.';
  end if;
  perform public.jls_store(v_id, p_new);
  return true;
end $$;
grant execute on function public.jls_change_password(text, text, text) to anon, authenticated;

-- ── 관리자가 남의 비밀번호 지정 (본인 비밀번호로 신원 확인) ─────────────────
create or replace function public.jls_set_password(
  p_actor_login text, p_actor_password text, p_target_id text, p_new text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_actor_id text; v_actor jsonb;
begin
  if p_new is null or length(p_new) < 4 then
    raise exception '비밀번호는 4자 이상이어야 합니다.';
  end if;

  v_actor_id := public.jls_check(p_actor_login, p_actor_password);
  if v_actor_id is null then
    perform public.jls_note_fail(p_actor_login);
    raise exception '본인 비밀번호가 올바르지 않습니다.';
  end if;

  select to_jsonb(u) into v_actor from public.users u where u.id::text = v_actor_id;
  if not ( coalesce(v_actor->>'role','') in ('admin','branch','super','visor')
        or coalesce((v_actor->>'is_manager')::boolean, false)
        or coalesce((v_actor->>'can_manage')::boolean, false) ) then
    raise exception '계정 관리 권한이 없습니다.';
  end if;

  if not exists (select 1 from public.users u where u.id::text = p_target_id) then
    raise exception '대상 계정을 찾을 수 없습니다.';
  end if;

  perform public.jls_store(p_target_id, p_new);
  return true;
end $$;
grant execute on function public.jls_set_password(text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';

-- ============================================================================
--  되돌리기 (문제가 생겼을 때 — users.password 는 아직 살아 있으므로 이것만으로 원복)
--    drop function if exists public.jls_login(text,text);
--    drop function if exists public.jls_change_password(text,text,text);
--    drop function if exists public.jls_set_password(text,text,text,text);
--    drop function if exists public.jls_check(text,text);
--    drop function if exists public.jls_store(text,text);
--    drop function if exists public.jls_note_fail(text);
--    drop table if exists public.user_secrets;
--    drop table if exists public.jls_login_throttle;
--    notify pgrst, 'reload schema';
-- ============================================================================
