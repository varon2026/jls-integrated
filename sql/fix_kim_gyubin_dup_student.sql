-- ============================================================================
--  수원분원 김규빈 — 여름학기에 잘못된 회원코드로 등록되면서 학생이 둘로 쪼개진 것 정리
--
--  왜 이렇게 됐나
--    2026 가을학기 시작인원이 여름학기 마감인원보다 1명 적게 계산됐다
--    (재원351+퇴원0+전출0−신규16−전입0=335 vs 여름 마감 336).
--    확인해보니 곡반초등학교 초등6 김규빈이 여름학기엔 회원코드 U003255196
--    (student_id: st_h66thnn)으로 등록됐다가, 가을학기엔 IMS가 올바른 코드
--    U003255305(student_id: st_mbsiyei)를 줘서 완전히 새 학생 프로필로
--    잡혔다. 분원 확인 결과 U003255305가 맞는 코드이고 여름학기 쪽(U003255196)이
--    잘못 발급된 것.
--
--    그 바람에 st_h66thnn은 가을학기 기록이 하나도 없는데도 퇴원 처리가
--    안 된 채로 남아서, "학기초" 계산에 조용히 안 잡혔다(퇴원도 전출도
--    아닌데 그냥 사라진 것으로 계산됨).
--
--    영향받는 표 확인 완료(둘 다 st_h66thnn 기준 딱 1건씩만 있음):
--    · semester_records — 여름학기 등록 기록 1건 (rec_5ocjcuj)
--    · student_movements — '신규' 이동이력 1건 (mv_z34xfys)
--    · counseling_histories · exam_scores · level_test_results — 없음(안전)
--
--  1. 조회 — 지금 상태 확인
-- ============================================================================
select id, code, name, school, grade from public.students where id in ('st_h66thnn','st_mbsiyei');
select * from public.semester_records where student_id in ('st_h66thnn','st_mbsiyei');
select * from public.student_movements where student_id='st_h66thnn';

-- 2. 백업
create table if not exists public._backup_kim_gyubin_dup as
select 'students' as src_table, to_jsonb(s.*) as row_data from public.students s where s.id='st_h66thnn'
union all
select 'semester_records', to_jsonb(r.*) from public.semester_records r where r.student_id='st_h66thnn'
union all
select 'student_movements', to_jsonb(m.*) from public.student_movements m where m.student_id='st_h66thnn';

-- 3. 수정 — 여름학기 기록을 올바른 학생(st_mbsiyei)으로 옮겨 붙이고, 잘못 만들어진 프로필 삭제
update public.semester_records set student_id='st_mbsiyei' where id='rec_5ocjcuj' and student_id='st_h66thnn';
update public.student_movements set student_id='st_mbsiyei' where id='mv_z34xfys' and student_id='st_h66thnn';
delete from public.students where id='st_h66thnn';

-- 4. 검증 — 전부 0이어야 함 (st_h66thnn을 참조하는 게 하나도 없어야 함)
select count(*) as students_left from public.students where id='st_h66thnn';
select count(*) as semrec_left from public.semester_records where student_id='st_h66thnn';
select count(*) as move_left from public.student_movements where student_id='st_h66thnn';

-- 검증2 — 여름 기록이 이제 김규빈(U003255305)한테 제대로 붙었는지, 이름/학교/학년까지 확인
select sr.semester_id, sr.branch_id, sr.class_name, s.code, s.name, s.school, s.grade
from public.semester_records sr join public.students s on s.id=sr.student_id
where sr.student_id='st_mbsiyei' order by sr.semester_id;

-- 되돌리기(잘못 실행했을 때):
--   insert into public.students (id, code, name, school, grade)
--     select row_data->>'id', row_data->>'code', row_data->>'name', row_data->>'school', row_data->>'grade'
--     from public._backup_kim_gyubin_dup where src_table='students';
--   update public.semester_records set student_id='st_h66thnn' where id='rec_5ocjcuj';
--   update public.student_movements set student_id='st_h66thnn' where id='mv_z34xfys';
