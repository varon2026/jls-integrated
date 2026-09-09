-- ============================================================================
--  수원분원 김도윤·최시원 — 가을학기 등록 기록 복원 (신규 아니라 기존생으로)
--
--  왜 이렇게 됐나
--    두 학생 다 여름학기부터 다니던 재원생인데, 가을학기 명단에 "신규생"으로
--    잘못 다시 등록됐었다(원인 조사 중). 분원이 "신규생 명단"에서 이 잘못된
--    신규 등록을 "입학취소"로 지웠는데, 그 처리가 신규 표시만 지우는 게
--    아니라 가을학기 등록 기록 자체를 통째로 삭제해버렸다. 그래서 지금 두
--    학생 다 가을학기 기록이 하나도 없는 상태(=명단 누락)다.
--
--    분원 확인: 둘 다 가을학기에도 실제로 계속 다니는 재원생 맞음.
--    그래서 반 배정 정보는 지워지기 전 값 그대로 살리고, "신규" 표시만
--    "기존생(재원 이어옴)"으로 바로잡아서 다시 넣는다.
--
--    · 김도윤(U002995917): [A1(1-3)] FA3/MWF/E6/중등B, 담임 Sam박준민
--    · 최시원(U003028419): [DSD1] FA2/MWF/A, 담임 Anna김주은
--    (둘 다 삭제 전 실제 값을 직접 조회해서 확인한 것 — 추측 아님)
--
--  1. 조회 — 정말 비어있는지 확인
-- ============================================================================
select * from public.semester_records where student_id in ('st_dx13ar7','st_hhyus1u') and semester_id='sem_2026_fall';

-- 2. 백업 — 지금(빈) 상태는 되돌릴 게 없으니 생략. 대신 넣을 값을 이 파일 안에 그대로 남겨둔다.

-- 3. 수정 — 기존생으로 복원
insert into public.semester_records
  (id, student_id, branch_id, semester_id, class_name, class_label, teacher, note,
   target_type, status, origin, enroll_date, withdraw_date, transfer, kind,
   transfer_in, transfer_to, withdraw_reason, withdraw_memo, grade)
values
  ('rec_dpik9gy', 'st_dx13ar7', 'br_suwon', 'sem_2026_fall',
   '[A1(1-3)] FA3/MWF/E6/중등B', '월수금 3부 · A1(1-3)_E6', 'Sam박준민', '',
   'MC', 'active', 'start', '', '', false, 'regular',
   false, null, null, null, '초등6'),
  ('rec_xuswj79', 'st_hhyus1u', 'br_suwon', 'sem_2026_fall',
   '[DSD1] FA2/MWF/A', '월수금 2부 · DSD1', 'Anna김주은', '',
   'MC', 'active', 'start', '', '', false, 'regular',
   false, null, null, null, '초등4')
on conflict (id) do nothing;

-- 4. 검증 — 두 줄 다 떠야 하고, origin이 'start'(신규 아님)여야 함
select student_id, class_name, teacher, origin, target_type, status
from public.semester_records
where student_id in ('st_dx13ar7','st_hhyus1u') and semester_id='sem_2026_fall';

-- 되돌리기(잘못 넣었을 때):
--   delete from public.semester_records where id in ('rec_dpik9gy','rec_xuswj79');
