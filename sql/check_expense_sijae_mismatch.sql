-- 2026-11-06 — 운영비 시재 차액(353,480원) 원인 확인. 읽기 전용.
-- 지금까지 확인된 것: 미처리 출금 없음 / 중복 등록 없음 / 수동입력은 "이월금"(2025-12-31,
-- 3,954,110원) 딱 하나뿐 / 은행 엑셀 자체의 최신 잔액은 761,207원(= 실제 통장과 일치, 2026-11-05).
-- 남은 가능성 두 가지를 가른다:
--  (A) "이월금" 자체가 틀렸다 (추적 시작 시점 잔액을 잘못 입력)
--  (B) 이월금은 맞는데, 그 뒤 은행 거래 중 일부가 등록 안 됐거나 중간에 빠졌다

-- 7. 은행 엑셀에 있는 제일 오래된 거래 — 그 거래 "직전" 잔액을 역산하면
--    추적 시작 시점의 진짜 잔액이 나온다. 이게 이월금(3,954,110)과 같아야 정상.
select tx_date, tx_time, description, withdrawal, deposit, balance,
       balance + withdrawal - deposit as 이_거래_직전_진짜잔액
from public.exp_bank_transactions
where branch = '서수원 분원'
order by tx_date asc, tx_time asc nulls first, id asc
limit 5;

-- 8. 은행 엑셀 전체(처리 여부 상관없이) 순입출금 합계 — entries에 다 등록됐다면
--    이 값이 entries 쪽 은행연동분 합계(1,114,687 - 3,954,110 = -2,839,423)와 같아야 한다.
select sum(deposit) as 총입금_은행, sum(withdrawal) as 총출금_은행,
       sum(deposit - withdrawal) as 순증감_은행
from public.exp_bank_transactions
where branch = '서수원 분원';

-- 9. 은행 거래 중 entries에 전혀 안 묶인(= 등록 자체가 안 된) 것들
select bt.id, bt.tx_date, bt.description, bt.withdrawal, bt.deposit, bt.status
from public.exp_bank_transactions bt
where bt.branch = '서수원 분원'
  and not exists (
    select 1 from public.exp_entries e where e.bank_tx_id = bt.id
  )
order by bt.tx_date;
