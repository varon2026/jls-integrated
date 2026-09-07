-- ============================================================================
--  내신반인데 정규반으로 저장된 명단 고치기
--
--  왜 이렇게 됐나
--    반 이름이 대괄호로 시작하면 무조건 정규반으로 봤다.
--    그래서 '[내신] 중1/천재(이),미래(문)' 처럼 올린 분원의 내신반이
--    통째로 정규반으로 저장돼서 정규 인원에 그대로 더해졌다.
--    (장안 2026 가을 8개 반 85명 — 반배정표에 'ACE 98명'으로 잡혀 있었다)
--
--    코드는 고쳤다. 이제 이름에 '내신'이 있으면 대괄호가 있어도 내신반으로 읽는다.
--    다만 이미 저장된 줄은 그대로라, 여기서 한 번 고쳐 준다.
--
--  ⚠️ 이 SQL을 먼저 돌리고 나서 분원에 '이름 고쳐서 다시 올려라'고 공지하세요.
--     순서가 바뀌면 정규반 줄과 내신반 줄이 둘 다 남아 인원이 두 배가 됩니다.
--
--  Supabase → SQL Editor 에 붙여넣고 한 단계씩 Run.
-- ============================================================================

-- 1. 조회 — 어느 분원 어느 반이 잘못 들어가 있는지
select b.name as 분원, r.semester_id as 학기, r.class_name as 반이름,
       count(*) as 인원,
       count(*) filter (where r.status='active') as 재원
from public.semester_records r
join public.branches b on b.id = r.branch_id
where coalesce(r.kind,'regular') = 'regular'
  and r.class_name like '%내신%'
group by b.name, r.semester_id, r.class_name
order by b.name, r.semester_id, r.class_name;

-- 1-b. 고치면 분원 인원이 얼마나 줄어드는지 (재원 기준)
select b.name as 분원, r.semester_id as 학기, count(*) as 줄어드는_인원
from public.semester_records r
join public.branches b on b.id = r.branch_id
where coalesce(r.kind,'regular') = 'regular'
  and r.class_name like '%내신%' and r.status = 'active'
group by b.name, r.semester_id
order by b.name, r.semester_id;

-- 2. 백업
create table if not exists public.bak_exam_kind_20260907 as
select id, kind, class_name, class_label
from public.semester_records
where coalesce(kind,'regular') = 'regular' and class_name like '%내신%';

-- 3. 수정 — 내신반으로 바꾼다
update public.semester_records
set kind = 'exam'
where coalesce(kind,'regular') = 'regular'
  and class_name like '%내신%';

-- 4. 검증 — 0이어야 한다
select count(*) as 남은_잘못된_줄
from public.semester_records
where coalesce(kind,'regular') = 'regular' and class_name like '%내신%';

-- 4-b. 바뀐 뒤 분원별 내신반 인원
select b.name as 분원, r.semester_id as 학기, count(*) filter (where r.status='active') as 내신반_재원
from public.semester_records r
join public.branches b on b.id = r.branch_id
where coalesce(r.kind,'regular') = 'exam'
group by b.name, r.semester_id
order by b.name, r.semester_id;

-- ============================================================================
-- 되돌리기
--   update public.semester_records r
--   set kind = b.kind
--   from public.bak_exam_kind_20260907 b
--   where b.id = r.id;
--
-- 백업 표 지우기 (다 확인한 뒤)
--   drop table if exists public.bak_exam_kind_20260907;
-- ============================================================================
