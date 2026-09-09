-- ============================================================================
--  DT·AT 재시험 기준점수(컷라인) — exam_config 테이블에 칸 하나 추가
--
--  왜 이렇게 만들었나
--    grader.html(시험채점)의 답안입력 화면엔 원래부터 "재시험" 버튼이 있었다.
--    (교사가 재채점 라운드를 새로 시작할 때 누르는 버튼 — 새로 만든 게 아님)
--    거기에 "점수가 통과점수(컷라인) 이상이면 그 버튼을 숨긴다"는 조건만 추가한다.
--    컷라인 값(DT 기본 80점, AT 기본 70점)은 화면에서 [수정] 버튼으로 바꿀 수 있어야
--    하므로, 이미 미응시 설정(disabled)을 저장하고 있는 exam_config 테이블에
--    cutline 칸만 하나 얹는다. (test_type 당 한 줄 — 'DT' 한 줄, 'AT' 한 줄)
--
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

alter table public.exam_config add column if not exists cutline numeric;

notify pgrst, 'reload schema';

-- 되돌리기:
--   alter table public.exam_config drop column if exists cutline;
