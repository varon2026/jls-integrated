-- ============================================================================
--  초5 ACE 진급시험 — 답안입력 결과 저장 (ace-e5-grading.html 전용)
--
--  왜 이렇게 만들었나
--    단독 페이지(아직 홈페이지 미연동)라 기존 exam_scores/level_test_results와
--    모양이 안 맞는다. exam_scores는 과목(지필/듣기/수행)별로 한 줄씩 쌓는
--    구조라 "학생 한 명 = 한 줄에 객관식·단어·해석·최종레벨 다 들어있는" 이
--    화면엔 안 맞고, level_test_results는 레벨테스트 예약(reservation_id)이
--    있어야 하는데 이 화면은 예약 없이 재원생 명단을 통째로 불러오는 방식이라
--    맞지 않는다. 그래서 이 화면 전용 표를 새로 둔다.
--
--    id는 화면에서 만드는 값을 그대로 쓴다 — 재원생은 'r_학생ID_학기ID'라
--    같은 학생을 다시 저장해도 줄이 안 늘고 덮어써진다. 비재원생(답안입력
--    추가로 넣은 학생)은 'manual_UUID'로 한 번 만들면 그 값을 계속 쓴다.
--
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

create table if not exists public.ace_e5_exam_results (
  id            text primary key,
  semester_id   text not null,
  branch_id     text,
  student_id    text,            -- 비재원생은 null
  student_code  text,
  student_name  text not null,
  school        text,
  grade         text,
  class_name    text,
  teacher       text,
  manual        boolean not null default false,   -- true면 비재원생(답안입력 추가로 넣은 학생)
  obj_answers   jsonb not null default '{}'::jsonb,   -- {"1":"3","2":"2",...} 일반시험(객관식) 40문항
  vocab_answers jsonb not null default '{}'::jsonb,   -- {"1":"1","2":"0",...} Voca 40문항 (맞으면 1)
  trans_scores  jsonb not null default '{}'::jsonb,   -- {"1":"2","2":"1",...} Translation 15문항 점수
  final_level   text,            -- 분원이 드롭다운에서 고른 최종레벨
  updated_at    timestamptz not null default now()
);

create index if not exists ace_e5_exam_results_scope
  on public.ace_e5_exam_results (semester_id, branch_id);

alter table public.ace_e5_exam_results enable row level security;

drop policy if exists ace_e5_exam_results_all on public.ace_e5_exam_results;
create policy ace_e5_exam_results_all on public.ace_e5_exam_results
  for all using (true) with check (true);

notify pgrst, 'reload schema';

-- 되돌리기:
--   drop table if exists public.ace_e5_exam_results;
