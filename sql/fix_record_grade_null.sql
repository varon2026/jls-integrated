-- ============================================================================
--  학기 기록(semester_records)의 학년이 비어 있는 학생 정리 — 서수원 2026 가을 지준서 건
--
--  왜 필요한가
--    전체명단을 올릴 때 학년 칸이 비어 있으면 그 학기 기록의 학년이 NULL로 저장된다.
--    ACE 진급생 탭은 학기 기록의 학년으로 '초5'를 가려서, 지준서가 목록에서 통째로 빠졌다.
--    (코드는 이제 기록 학년이 비면 학생 정보 학년으로 대신 보게 고쳤다. 이 SQL은 데이터도 맞춰 두는 것.)
--
--  ⚠️ 학기 기록의 학년은 '그 학기 명단값'이라 학기마다 다를 수 있다. 그래서 학생 정보의 학년(지금 학년)을
--    옛 학기 기록에 복사하면 틀린다. 이 SQL은 2026 가을학기 기록만 대상으로 한다.
--
--  Supabase → SQL Editor 에서 한 덩어리씩 실행한다. 주석 줄은 빼고 쿼리만 붙여 넣는다.
-- ============================================================================

-- 1. 조회 — 2026 가을 기록 중 학년이 비어 있고, 학생 정보에는 학년이 있는 학생
select b.name as 분원, st.name as 학생, st.grade as 학생정보_학년, r.class_name, r.teacher
from semester_records r
join students st on st.id = r.student_id
join branches b on b.id = r.branch_id
where r.semester_id = 'sem_2026_fall'
  and (r.grade is null or r.grade = '')
  and st.grade is not null and st.grade <> ''
order by b.name, st.name;

-- 2. 백업
create table if not exists bak_semrec_grade_null_20261116 as
select r.* from semester_records r
where r.semester_id = 'sem_2026_fall' and (r.grade is null or r.grade = '');

-- 3. 수정 — 학생 정보의 학년을 기록 학년에 채운다(2026 가을만)
update semester_records r
set grade = st.grade
from students st
where st.id = r.student_id
  and r.semester_id = 'sem_2026_fall'
  and (r.grade is null or r.grade = '')
  and st.grade is not null and st.grade <> '';

-- 4. 검증 — 0이어야 한다
select count(*) as 아직_비어있는_기록
from semester_records r
join students st on st.id = r.student_id
where r.semester_id = 'sem_2026_fall'
  and (r.grade is null or r.grade = '')
  and st.grade is not null and st.grade <> '';

-- 되돌리기(문제가 생기면)
-- update semester_records r set grade = b.grade from bak_semrec_grade_null_20261116 b where b.id = r.id;
