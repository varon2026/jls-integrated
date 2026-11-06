-- 2026-11-06 — 운영비 현황 "현재시재"가 1,114,687원인데 실제 통장은 761,207원
-- (차이 353,480원). 원인 확인용 조회 SQL — 아무것도 바꾸지 않습니다. 결과만 보여주세요.
-- <branch_id> 자리에 해당 분원의 branch 값을 넣어서 돌려주세요 (운영비 화면 URL이나
-- 아래 1번 쿼리로 먼저 확인 가능합니다).

-- 0. 이 결과로 쓰는 branch 값이 뭔지 먼저 확인(분원 코드/이름이 어떻게 저장되는지)
select distinct branch from public.entries limit 20;

-- 1. 지금 시재 계산값 그대로 재현 (앱과 같은 계산: 입금 - 지출, 전체 기간)
select
  sum(case when kind='입금' then amt else 0 end) as 총입금,
  sum(case when kind='지출' then amt else 0 end) as 총지출,
  sum(case when kind='입금' then amt else -amt end) as 현재시재_계산값
from public.entries
where branch = '<branch_id>';

-- 2. 가장 유력한 원인 — 통장에선 빠져나갔는데 아직 "등록" 안 돼서 시재에 안 잡힌 지출
--    (업로드는 됐지만 미처리 상태로 쌓여있는 출금 거래)
select id, tx_date, description, withdrawal, deposit, status
from public.bank_transactions
where branch = '<branch_id>'
  and status <> '처리완료'
  and withdrawal > 0
order by tx_date;

select sum(withdrawal) as 미처리_출금_합계
from public.bank_transactions
where branch = '<branch_id>'
  and status <> '처리완료'
  and withdrawal > 0;

-- 3. 혹시 같은 은행거래가 두 번 "등록"돼서 중복으로 잡힌 건 없는지
select bank_tx_id, count(*) as 건수, sum(amt) as 합계
from public.entries
where branch = '<branch_id>' and bank_tx_id is not null
group by bank_tx_id
having count(*) > 1;
