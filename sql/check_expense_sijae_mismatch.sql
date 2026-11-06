-- 2026-11-06 — 운영비 시재 차액(353,480원) 원인 확인. 읽기 전용.
-- 지금까지 확인: 이월금(3,954,110) 정확함 / 등록 안 된 은행거래 없음 / 중복 없음 /
-- 은행거래 순증감(-2,839,423)도 entries랑 정확히 일치함.
-- 그런데도 계산값(1,114,687)이 은행 엑셀 최신 잔액(761,207)과 다름 →
-- 업로드한 엑셀 자체에 "통째로 안 올라간 기간"(거래 내역 자체가 비어있는 구간)이
-- 있다는 뜻. 아래로 그 구간을 찾는다 — 바로 앞 거래의 잔액에서 이번 거래 금액을
-- 반영한 값이, 이번 거래의 balance와 다르게 뛰는 지점을 찾으면 됨.

-- 10. 잔액이 안 이어지는(끊기는) 지점 찾기 — 차이가 0이 아닌 줄이 바로 그 구간이다.
with ordered as (
  select
    id, tx_date, tx_time, description, withdrawal, deposit, balance,
    lag(balance) over (order by tx_date, tx_time nulls first, id) as 이전거래_잔액
  from public.exp_bank_transactions
  where branch = '서수원 분원'
)
select
  id, tx_date, tx_time, description, withdrawal, deposit, balance,
  이전거래_잔액,
  (이전거래_잔액 - withdrawal + deposit) as 이번거래_예상잔액,
  balance - (이전거래_잔액 - withdrawal + deposit) as 안맞는_차액
from ordered
where 이전거래_잔액 is not null
  and balance <> (이전거래_잔액 - withdrawal + deposit)
order by tx_date, tx_time;
