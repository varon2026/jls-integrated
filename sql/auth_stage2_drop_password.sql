-- ============================================================================
--  2단계 — users 표에서 비밀번호 칼럼을 없앤다
--
--  ★ 순서를 지켜야 한다
--    1) 새 코드를 먼저 배포한다 (git push → 사이트 반영)
--    2) sql/auth_stage1.sql 을 돌린다
--    3) 전 분원이 로그인되는지 확인한다  ← 여기까지는 아무것도 안 깨진다
--    4) 그 다음에 이 파일을 돌린다
--
--  이걸 돌리고 나면 브라우저로 비밀번호가 아예 내려가지 않는다.
--  대신 예전 코드(캐시된 옛날 JS)로는 로그인이 안 된다 — 새로고침(Ctrl+F5)하면 된다.
-- ============================================================================

-- 혹시 빠진 계정이 없는지 먼저 확인 — 결과가 0줄이어야 한다
do $$
declare v_missing int;
begin
  select count(*) into v_missing
    from public.users u
    left join public.user_secrets s on s.user_id = u.id::text
   where s.user_id is null;
  if v_missing > 0 then
    raise exception '비밀번호가 아직 안 옮겨진 계정이 %개 있습니다. sql/auth_stage1.sql 을 먼저 돌리세요.', v_missing;
  end if;
end $$;

alter table public.users drop column if exists password;

-- 되돌리기용으로 남겨둔 평문도 지운다
update public.user_secrets set legacy_plain = null where legacy_plain is not null;

notify pgrst, 'reload schema';

-- ============================================================================
--  되돌리기 (2단계까지 돌린 뒤 문제가 생겼을 때)
--    비밀번호는 해시로만 남아 있어 평문 복구가 안 된다.
--    칼럼만 되살리고 관리자가 비밀번호를 다시 지정해야 한다:
--      alter table public.users add column if exists password text;
--      notify pgrst, 'reload schema';
-- ============================================================================
