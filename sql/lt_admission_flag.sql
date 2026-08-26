-- ============================================================================
-- 레벨테스트 예약에 "이 시험은 다음 학기 입학용" 표시를 붙인다.
--
-- 왜 학생 단위인가:
--   같은 날 시험을 봐도 그 학기에 바로 등록하는 학생과 다음 학기에 등록할
--   학생이 섞인다. 8월에 봐서 8월(여름)에 등록하는 애도 있고, 8월에 봐서
--   9월(가을)에 등록하는 애도 있다. 날짜로는 가를 수 없어서 예약마다 표시한다.
--
--   값 = 입학 대상 학기 id (예: 'sem_2026_fall'). 비어 있으면 전형이 아니다.
--   '다음학기 대기'를 누른 학생은 wait_semester로 이미 알 수 있으므로
--   따로 켜지 않아도 전형에 자동으로 잡힌다.
--
-- 실행: Supabase → SQL Editor 에 붙여넣고 Run
-- ============================================================================

alter table public.level_test_reservations
  add column if not exists admission_semester text;

create index if not exists lt_res_admission_idx
  on public.level_test_reservations (admission_semester)
  where admission_semester is not null;
