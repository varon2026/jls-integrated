-- ============================================================================
--  시상관리 — 담임이 등록하는 MIP · BEST BOOK · BEST SPEECH 후보/등록
--
--  왜 이렇게 만들었나
--    DT·AT 1등은 exam_scores에서 그때그때 계산해서 보여주는 값이라 표가 필요 없다
--    (재시험한 학생은 exam_scores의 round/prev_scores로 걸러낸다).
--    MIP·BEST BOOK·BEST SPEECH는 담임이 반배정표에서 학생 이름을 눌러 직접
--    등록/해제하는 값이라 저장할 곳이 필요해서 표 하나를 새로 만든다.
--
--    분원 관리자가 투표해서 최종 당선자를 뽑는 기능은 다음 단계에서 넣는다.
--    지금은 담임이 등록한 것 + DT·AT 자동 결과를 보여주는 것까지만.
--
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

create table if not exists public.award_entries (
  id            text primary key,
  branch_id     text not null,
  semester_id   text not null,
  student_code  text not null,
  student_name  text,
  class_name    text,     -- 등록 당시 반 이름(가을학기 반) — 나중에 명단 뽑을 때 그대로 씀
  teacher       text,
  category      text not null,   -- mip | best_book | best_speech
  reason        text,            -- MIP만 사용 (사유)
  created_by    text,            -- 등록한 담임 계정 아이디
  created_at    timestamptz not null default now()
);

create unique index if not exists award_entries_one_per_category
  on public.award_entries (branch_id, semester_id, student_code, category);

create index if not exists award_entries_scope
  on public.award_entries (branch_id, semester_id);

alter table public.award_entries enable row level security;

drop policy if exists award_entries_all on public.award_entries;
create policy award_entries_all on public.award_entries
  for all using (true) with check (true);

notify pgrst, 'reload schema';

-- 되돌리기:
--   drop table if exists public.award_entries;
