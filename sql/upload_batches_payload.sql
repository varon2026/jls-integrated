-- 전체명단 업로드 되돌리기 기능용: upload_batches에 되돌리기 정보(payload) 컬럼 추가
-- Supabase → SQL Editor에 붙여넣고 실행하세요. (코드 배포 "전에" 먼저 실행)
alter table upload_batches add column if not exists payload jsonb;
