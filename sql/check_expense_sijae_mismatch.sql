-- 2026-11-06 — 운영비 현재시재-실제통장 차액(353,480원) 원인 확인. 읽기 전용.

-- 4. 은행거래랑 안 묶이고 수동으로 입력된 내역이 얼마나 되는지 (여기서 틀린 게 있을 가능성)
select kind, count(*) as 건수, sum(amt) as 합계
from public.exp_entries
where branch = '서수원 분원' and bank_tx_id is null
group by kind;

-- 5. 수동 입력 내역 전체 목록 (최근순) — 여기서 실수로 중복 입력했거나 금액 잘못 적은 게 없는지 눈으로 확인
select id, date, kind, amt, acct, vendor, memo, payment_method
from public.exp_entries
where branch = '서수원 분원' and bank_tx_id is null
order by date desc, id desc;

-- 6. 은행 엑셀에 실제로 찍혀있는 최신 잔액(국민은행이 알려주는 진짜 잔액) 확인
select tx_date, tx_time, description, withdrawal, deposit, balance
from public.exp_bank_transactions
where branch = '서수원 분원'
order by tx_date desc, tx_time desc nulls last, id desc
limit 5;
