-- ============================================================================
--  ACE 이관생 — "진급 안함" 처리 표
--
--  왜 필요한가
--    ACE 이관생 명단은 원래 자동 추정("직전 학기엔 체스반, 이번 학기는
--    에이스반"이면 이관)으로만 돼 있어서, 사람이 "이 학생은 레벨이 안 돼서
--    보류" 같은 예외를 남길 데가 없었다.
--    기본은 전원 '진급'으로 두고(행이 없으면 진급), 분원이 예외로 '진급 안함'
--    버튼을 누른 학생만 사유와 함께 이 표에 저장한다 — exam_roster_removals와
--    같은 방식(퇴원 처리가 아니라 이 화면 안에서만 상태를 바꾸는 것).
--
--  cohort_semester_id = 그 학생이 속한 코호트의 가을학기 id로 고정한다
--  (겨울학기에 다시 봐도 같은 가을 코호트 기준으로 유지되게).
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

create table if not exists public.ace_move_outcomes (
  id                  text primary key,
  student_id          text not null,
  cohort_semester_id  text not null,
  branch_id           text not null,
  reason              text not null,
  updated_by          text,
  updated_at          timestamptz not null default now()
);

create unique index if not exists ace_move_outcomes_key
  on public.ace_move_outcomes (student_id, cohort_semester_id);

alter table public.ace_move_outcomes enable row level security;

drop policy if exists ace_move_outcomes_all on public.ace_move_outcomes;
create policy ace_move_outcomes_all on public.ace_move_outcomes
  for all using (true) with check (true);

notify pgrst, 'reload schema';

-- 되돌리기: drop table if exists public.ace_move_outcomes;
