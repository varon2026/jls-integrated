-- ============================================================================
--  내신반이 어느 회차(MC1/MC2/MC3)인지 지정하는 표
--
--  왜 필요한가
--    내신 기간은 학교·학년마다 달라서 시스템이 알아낼 방법이 없다.
--    처음엔 '전체명단을 올린 달'로 추정했는데, 그건 내신반이 열린 달이 아니라
--    엑셀을 사이트에 올린 날이라 8월에 올리면 전부 MC3로 잡혀버렸다.
--    추정을 버리고 사람이 반별로 한 번 골라주는 방식으로 바꾼다.
--
--  지정 안 한 내신반은 상담률에 아예 안 잡힌다 (정규반도 영향 없음).
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

create table if not exists public.exam_class_stages (
  id          text primary key,
  branch_id   text not null,
  semester_id text not null,
  class_name  text not null,
  stage       text not null,          -- MC1 | MC2 | MC3
  updated_at  timestamptz not null default now()
);

create unique index if not exists exam_class_stages_key
  on public.exam_class_stages (branch_id, semester_id, class_name);

alter table public.exam_class_stages enable row level security;

drop policy if exists exam_class_stages_all on public.exam_class_stages;
create policy exam_class_stages_all on public.exam_class_stages
  for all using (true) with check (true);

notify pgrst, 'reload schema';

-- 되돌리기: drop table if exists public.exam_class_stages;
