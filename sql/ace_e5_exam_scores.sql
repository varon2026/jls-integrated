-- ============================================================================
--  초5 ACE 진급시험 — 계산된 점수 칸 추가 (ace_e5_exam_results)
--
--  왜 필요한가
--    지금은 raw 답안(obj_answers/vocab_answers/trans_scores)만 저장돼 있어서,
--    점수를 보려면 정답지 전체(ace-e5-grading.html의 E5_EXAM 등)를 다시 읽어야
--    한다. 그 정답지를 ACE 이관생 화면(inwon-app) 쪽에도 복사해 넣으면, 나중에
--    한쪽만 고쳤을 때 서로 다른 점수가 나오는 문제가 생긴다(이 저장소에서
--    반복됐던 문제 — app.js/inwon-app/app.js에 같은 함수가 양쪽에 있는 경우와
--    같은 함정).
--    그래서 채점 화면(ace-e5-grading.html)이 저장할 때 점수까지 같이 계산해서
--    넣어두고, ACE 이관생 화면은 이 점수 칸만 그대로 읽는다 — 정답지는 한 곳
--    (ace-e5-grading.html)에만 있다.
--
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

alter table public.ace_e5_exam_results
  add column if not exists obj_score   numeric,
  add column if not exists vocab_score numeric,
  add column if not exists trans_score numeric;

notify pgrst, 'reload schema';

-- 되돌리기:
--   alter table public.ace_e5_exam_results drop column if exists obj_score, drop column if exists vocab_score, drop column if exists trans_score;
