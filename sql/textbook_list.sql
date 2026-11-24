-- ============================================================================
--  교재리스트 (학사관리 › 교재리스트) — 표 두 개
--
--  왜 이렇게 만들었나
--    기본 교재 목록(체스·에이스)은 코드(inwon-app/textbook-data.js)에 들어 있다.
--    분원이 어떤 레벨의 교재를 바꾸면(활용교재 변경, HM처럼 전부 외부교재 등)
--    그 분원·학기·레벨의 '바뀐 전체 목록'을 tb_levels 에 한 줄로 저장한다.
--    줄이 없으면 기본 목록을 그대로 쓴다. (기본 목록이 나중에 바뀌어도
--    분원이 고친 레벨은 그 분원 것이 유지된다 — '기본으로 되돌리기'는 줄을 지움)
--
--    tb_checks 는 '교재 한 권' 단위 체크다.
--      delivered = 학원(분원)이 선생님께 줬다
--      received  = 선생님이 받은 게 맞다고 확인했다
--      mismatch  = 받은 것과 다르다고 표시했다
--    선생님은 반 이름에서 자동으로 정해지므로 선생님 표는 따로 없다.
--
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

create table if not exists public.tb_levels (
  branch_id   text not null,
  semester_id text not null,
  level_key   text not null,        -- DSA1 · PA1|3 (에이스는 |3 = 1-3개월, |4 = 4-6개월)
  items       jsonb not null,       -- [{n:교재명, a:영역}] 이 레벨의 바뀐 전체 목록
  updated_by  text,
  updated_at  timestamptz not null default now(),
  primary key (branch_id, semester_id, level_key)
);

create table if not exists public.tb_checks (
  branch_id   text not null,
  semester_id text not null,
  teacher_key text not null,        -- 담임 한글 이름 (teacherKey)
  level_key   text not null,
  book_name   text not null,
  delivered   boolean not null default false,
  received    boolean not null default false,
  mismatch    boolean not null default false,
  updated_by  text,
  updated_at  timestamptz not null default now(),
  primary key (branch_id, semester_id, teacher_key, level_key, book_name)
);

create index if not exists tb_checks_scope on public.tb_checks (branch_id, semester_id);

alter table public.tb_levels enable row level security;
alter table public.tb_checks enable row level security;

drop policy if exists tb_levels_all on public.tb_levels;
create policy tb_levels_all on public.tb_levels for all using (true) with check (true);
drop policy if exists tb_checks_all on public.tb_checks;
create policy tb_checks_all on public.tb_checks for all using (true) with check (true);

notify pgrst, 'reload schema';

-- 되돌리기:
--   drop table if exists public.tb_checks;
--   drop table if exists public.tb_levels;
