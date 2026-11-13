-- ============================================================================
--  수원분원 DT MSB1만 '시험지 리뉴얼 전' 정답키로 채점 — 이번 학기 한정 (2026-11-13 운영자 요청)
--  왜: 11/12에 MS레벨 정답키를 전 분원 공통으로 새 시험지 것으로 바꿨는데, 수원분원 MSB1은 예전 시험지로 시험을 봤다.
--  어떻게: 옛 정답키(백업 exam_keys_backup_ms_20261112)를 '수원분원 전용·이번 학기 전용' 키로 한 줄 더 넣는다.
--         화면(grader.html keyOfLevel)이 그 분원·그 학기 반에서는 이 키를 먼저 쓰고, 다른 분원은 새 정답키 그대로다.
--  ⚠️ 학기가 바뀌면 자동으로 이 키는 안 쓰인다(semester 가 다르면 무시). 지워도 된다.
--  4단계: 1.조회 → 2.백업(이미 있음) → 3.수정 → 4.검증.  한 덩어리씩 실행하세요(주석 줄은 빼고 복사해도 됩니다).
-- ============================================================================

-- 1. 조회: 수원분원 이름·분원 id, 그 반이 저장한 MSB1 점수의 학기 이름, 옛 정답키가 백업에 있는지
select id, name, branch_id from branches where name like '%수원%';
select distinct semester, branch, key_id is null as 정답키_끊김, count(*) over (partition by semester, branch, key_id is null) as 건수
  from exam_scores where test_type='DT' and key_name='DT · MSB1' and branch like '%수원%';
select id, level, num_q from exam_keys_backup_ms_20261112 where upper(level)='MSB1';

-- 2. 칸 추가(없으면): 분원 전용·학기 전용 키를 구분하는 두 칸
alter table exam_keys add column if not exists branch_id text;
alter table exam_keys add column if not exists semester text;
notify pgrst, 'reload schema';

-- 3. 수정: 수원분원 id = br_suwon (서수원분원 br_seosuwon 과 다름). 학기 이름은 그 점수에 저장된 값을 그대로 가져온다.
insert into exam_keys (name,test_type,track,level,num_q,answers,updated_at,branch_id,semester)
select name,test_type,track,level,num_q,answers,now(),'br_suwon',(select semester from exam_scores where test_type='DT' and key_name='DT · MSB1' and branch='수원분원' limit 1)
from exam_keys_backup_ms_20261112 where upper(level)='MSB1' limit 1;

-- 3-2. 11/11~11/12에 저장돼 정답키와 끊긴 수원 MSB1 점수를 이 키에 다시 연결 (끊긴 것만)
update exam_scores s set key_id=(select id from exam_keys where branch_id='br_suwon' and upper(level)='MSB1' limit 1)
where s.test_type='DT' and s.key_name='DT · MSB1' and s.key_id is null and s.branch='수원분원';

-- 4. 검증: 연결 안 된 수원 MSB1 점수가 0 이어야 하고, 전용 키가 1개여야 한다
select count(*) as 아직_끊긴_점수 from exam_scores where test_type='DT' and key_name='DT · MSB1' and key_id is null and branch='수원분원';
select id, level, branch_id, semester, num_q from exam_keys where branch_id is not null;

-- 되돌리기: delete from exam_keys where branch_id='br_suwon' and upper(level)='MSB1';
