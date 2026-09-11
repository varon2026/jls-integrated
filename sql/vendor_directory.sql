-- 거래업체 관리 (본사 전용) — vd_vendors / vd_history 테이블 + 서류 보관용 스토리지 버킷
--
-- ⚠️ 이 SQL은 메인 Supabase 프로젝트가 아니라, 교재관리·운영비관리가 쓰는
--    별도 프로젝트(hplndiuoohantbalixwu.supabase.co)의 SQL Editor에서 실행하세요.
--    books.js의 BOOKS_SB_URL / expense-app의 SUPA_URL과 같은 프로젝트입니다.
--
-- 1. 거래업체 목록
create table if not exists vd_vendors (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  manager text,
  phone text not null,
  biz_no text,
  branch text not null default '전분원',
  biz_doc_url text,
  bank_doc_url text,
  created_at timestamptz not null default now()
);

-- 2. 업체별 수리·점검 이력
create table if not exists vd_history (
  id bigint generated always as identity primary key,
  vendor_id bigint not null references vd_vendors(id) on delete cascade,
  date date not null,
  memo text not null,
  status text not null default '완료',
  cost integer,
  created_at timestamptz not null default now()
);

create index if not exists vd_history_vendor_id_idx on vd_history(vendor_id);

-- 3. 사업자등록증·통장사본 보관용 스토리지 버킷
--    (교재관리 receipts 버킷과 같은 방식: 공개 버킷 + 익명 키로 업로드/조회)
insert into storage.buckets (id, name, public)
values ('vendor-docs', 'vendor-docs', true)
on conflict (id) do nothing;

create policy if not exists "vendor-docs 읽기" on storage.objects
  for select using (bucket_id = 'vendor-docs');
create policy if not exists "vendor-docs 업로드" on storage.objects
  for insert with check (bucket_id = 'vendor-docs');
create policy if not exists "vendor-docs 수정" on storage.objects
  for update using (bucket_id = 'vendor-docs');

-- 검증: 아래 두 줄을 실행해서 테이블이 비어있는 상태로 잘 만들어졌는지 확인
-- select count(*) from vd_vendors;   -- 0 이어야 함
-- select count(*) from vd_history;   -- 0 이어야 함
