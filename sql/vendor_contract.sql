-- 거래업체 관리 — 계약서 올리는 칸 추가
--
-- ⚠️ vendor_directory.sql 과 같은 Supabase 프로젝트(hplndiuoohantbalixwu)의 SQL Editor에서 실행하세요.
-- 계약서 파일은 사업자등록증·통장사본과 같은 vendor-docs 버킷에 올라가므로 버킷 작업은 없습니다.
-- 이 SQL을 실행하기 전에 계약서를 올리면 화면에 "계약서 칸이 아직 없어요"라고 안내가 뜹니다.

-- 1. 조회
select count(*) as 업체수 from vd_vendors;

-- 2. 계약서 주소 칸 추가 (여러 번 실행해도 안전)
alter table vd_vendors add column if not exists contract_doc_url text;

-- 3. 검증: contract_doc_url 한 줄이 나와야 함
select column_name from information_schema.columns
where table_name = 'vd_vendors' and column_name = 'contract_doc_url';

-- 되돌리기 (계약서 주소를 전부 잃으므로 꼭 필요할 때만)
-- alter table vd_vendors drop column contract_doc_url;
