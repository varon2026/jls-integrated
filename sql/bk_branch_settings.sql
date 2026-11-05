-- 교재관리 분원별 입금계좌·문자 양식 (예전엔 브라우저에만 저장돼서 자꾸 사라졌음)
-- 1. 조회: 아직 없어야 정상
select to_regclass('public.bk_branch_settings');

-- 2. (새 표라 백업 없음) / 3. 생성
create table if not exists bk_branch_settings (
  branch          text primary key,
  account         text,
  account_holder  text,
  sms_template    text,
  updated_at      timestamptz default now()
);
alter table bk_branch_settings disable row level security;
grant all on bk_branch_settings to anon, authenticated;

-- 4. 검증: 표가 보이면 정상
select to_regclass('public.bk_branch_settings');

-- 되돌리기: drop table bk_branch_settings;
