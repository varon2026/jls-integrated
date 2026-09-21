-- ============================================================================
--  학생 영어이름 (시상관리 엑셀 다운로드에 들어간다)
--
--  왜 필요한가
--    IMS 전체명단 엑셀에는 '영어이름' 열이 있는데, 지금까지 학사관리는 그 열을 읽지 않고
--    버렸다. 시상관리에서 상장·명단을 만들 때 영어이름이 꼭 필요해서, 학생 표에 칸을
--    하나 만들고 전체명단을 올릴 때 같이 저장한다.
--
--    이미 들어와 있는 학생은 이 칸이 비어 있다. SQL을 돌린 뒤 전체명단을 한 번 다시
--    올리면 채워진다(반·담임은 원래대로 최신 값으로 갱신되고, 영어이름만 새로 들어간다).
--
--    앱은 이 칸이 있는지 스스로 확인한다 — SQL을 안 돌렸으면 영어이름 저장만 건너뛰고
--    나머지는 예전 그대로 동작한다.
--
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

alter table public.students add column if not exists english_name text;

notify pgrst, 'reload schema';

-- 확인: 영어이름이 채워진 학생 수 (전체명단을 다시 올린 뒤 늘어난다)
--   select count(*) filter (where english_name is not null and english_name <> '') as 채워짐, count(*) as 전체 from public.students;

-- 되돌리기:
--   alter table public.students drop column if exists english_name;
