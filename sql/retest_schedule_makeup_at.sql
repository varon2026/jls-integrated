-- ============================================================================
--  재시험관리 — 보강 일정 칸 추가 (retest_schedule.makeup_at)
--
--  왜 이렇게 만들었나
--    지금까지 retest_schedule에는 일정 칸이 하나(scheduled_at)뿐이었는데,
--    이건 "재시험 보는 날짜"로 쓰고 있었다. 그런데 부장님 요청으로 "보강
--    받으러 오는 날짜"도 따로 잡을 수 있어야 함 — 재시험 보기 전에 보강을
--    먼저 하는 경우가 많아서 둘은 서로 다른 날짜다.
--
--    기존 scheduled_at 칸 이름은 그대로 두고(이미 저장된 값이 전부
--    "재시험 일정"이므로 안전) makeup_at 칸만 새로 추가한다.
--
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

alter table public.retest_schedule add column if not exists makeup_at timestamptz;

notify pgrst, 'reload schema';

-- 되돌리기:
--   alter table public.retest_schedule drop column if exists makeup_at;
