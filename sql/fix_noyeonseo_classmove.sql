-- ============================================================================
--  수원분원 노연서 — 반 이동 처리 중 반배정표에 반영 안 된 것 복구
--
--  왜 이렇게 됐나
--    9/1에 노연서(잠원중학교 중1)를 화목 2부 MA1(4-6)_M1 반에서 MA2(4-6)_M1
--    반으로 옮겼다. 반 이동 이력(student_movements, classChange)엔 정상
--    기록됐는데, 정작 반배정 정보(semester_records.class_name/teacher)는
--    옛날 반(MA1(4-6), 담임 Anna김주은) 그대로 남아있었다.
--    같은 날 다른 학생들 반 이동은 다 정상 반영됐는데 이 학생만 안 된 걸로
--    보아, 코드 자체 버그라기보단 그때 저장이 반쯤(이력만) 되고 반배정
--    쪽 저장은 실패한 것으로 보인다(moveStudent() 코드는 이력·반배정을
--    같이 저장하도록 짜여 있음 — inwon-app/app.js).
--
--    이동 이력(student_movements.memo)에 정확히 뭘로 바꿔야 하는지 이미
--    적혀 있고, 실제로 그 반("[MA2(4-6)] FA2/TTH/M1/H", 담임 Hailey백혜진)이
--    다른 학생들 기록에도 존재하는 진짜 반인 것까지 확인함.
--
--  1. 조회
-- ============================================================================
select id, student_id, class_name, class_label, teacher, semester_id
from public.semester_records
where student_id='st_7r3ooib' and semester_id='sem_2026_fall' and kind='regular';

-- 2. 백업
create table if not exists public._backup_noyeonseo_classmove as
select * from public.semester_records
where student_id='st_7r3ooib' and semester_id='sem_2026_fall' and kind='regular';

-- 3. 수정 — 이동 이력에 적힌 '옮겨간 반' 그대로 반영
update public.semester_records
set class_name='[MA2(4-6)] FA2/TTH/M1/H',
    class_label='화목 2부 · MA2(4-6)_M1',
    teacher='Hailey백혜진'
where student_id='st_7r3ooib' and semester_id='sem_2026_fall' and kind='regular'
  and class_name='[MA1(4-6)] FA2/TTH/M1/A';  -- 혹시 모를 사고 방지로 옛 반일 때만 바뀌게

-- 4. 검증 — 노연서가 새 반(MA2)에 뜨는지
select student_id, class_name, class_label, teacher
from public.semester_records
where student_id='st_7r3ooib' and semester_id='sem_2026_fall' and kind='regular';

-- 되돌리기:
--   update public.semester_records r set class_name=b.class_name, class_label=b.class_label, teacher=b.teacher
--     from public._backup_noyeonseo_classmove b where r.id=b.id;
