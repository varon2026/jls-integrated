-- 2026-11-06 — 탕정분원 김현성 학생: 원래 M1 시험을 봐야 하는데 실수로 E6를 줘서
-- 성적표가 E6/A1로 나와있던 건을 수정. 운영자 확인: 실제 시험 본 날짜는 11/4(예약은
-- 이미 11/4로 맞게 돼 있었고, 성적표에 저장된 날짜만 10/31로 남아있던 것).
--
-- 바꾸는 것: 시험 본 날짜(10/31→11/4) · 시험지명 표시(E6→M1(일반형)) · 레벨(A1→MA1).
-- 안 바꾸는 것: 문항별 답안·점수(실제로 E6 문제를 풀었으니 그 기록은 그대로 둠),
-- 학교/학년(원래 학년인 초등6 그대로 — 표지에 보이는 학년은 "시험 본 학년"이 아니라
-- "학생의 실제 학년"이라 안 건드림).
--
-- 코드 확인 결과: 성적표의 "레벨 로드맵" 그래프는 저장된 그림이 아니라, 열 때마다
-- (학년, 시험지명, 레벨)을 가지고 그 자리에서 다시 그린다. 그래서 시험지명만
-- M1(일반형)로 바꿔주면, 학년(초등6)+시험지명(M1) 조합을 보고 "다음 학년(중1) 시험을
-- 봤다"고 자동으로 알아채서 그래프도 M1 단계(PA2/A1/A2/MA1/MA2)로 저절로 바뀐다 —
-- 그래프 쪽은 따로 손 안 대도 됨.

-- ===== 1. 조회 — 이 학생의 해당 성적표가 정확히 1건인지 확인 =====
select id, student_name, branch_id, exam_title, assigned_level, test_date,
       result_json->>'title' as json_title,
       result_json->>'assignedLevel' as json_level,
       result_json->>'testDate' as json_testdate
from public.level_test_results
where student_name = '김현성'
  and branch_id = (select id from public.branches where name like '탕정%' limit 1)
  and exam_title = 'E6'
order by test_date desc;

-- ===== 2. 백업 =====
create table if not exists public._backup_kimhyeonseong_e6_to_m1 as
select * from public.level_test_results
where student_name = '김현성'
  and branch_id = (select id from public.branches where name like '탕정%' limit 1)
  and exam_title = 'E6';

-- ===== 3. 수정 (1번 조회 결과가 정확히 그 학생 그 건 1개인 것을 확인한 뒤 실행) =====
-- 아래 <ID> 자리에 1번에서 확인한 id 값을 넣어서 실행하세요 (이름만으로 걸면
-- 동명이인이 있을 수 있어서, id로 콕 찍어서 수정하는 게 안전합니다).
update public.level_test_results
set test_date = '2026-11-04',
    exam_title = 'M1(일반형)',
    assigned_level = 'MA1',
    result_json = jsonb_set(
      jsonb_set(
        jsonb_set(result_json, '{testDate}', to_jsonb('2026-11-04'::text)),
        '{title}', to_jsonb('M1(일반형)'::text)
      ),
      '{assignedLevel}', to_jsonb('MA1'::text)
    )
where id = '<ID>';

-- 예약 쪽 표시(응시자 상세 표의 "성적" 칸)도 같이 맞춰줌 — reservation_id는 3번
-- 수정한 행의 reservation_id 값으로.
update public.level_test_reservations
set test_level = 'MA1'
where id = (select reservation_id from public.level_test_results where id = '<ID>');

-- ===== 4. 검증 — 아래 두 값이 M1(일반형)/MA1/2026-11-04로 나오면 완료 =====
select exam_title, assigned_level, test_date, result_json->>'title', result_json->>'assignedLevel', result_json->>'testDate'
from public.level_test_results where id = '<ID>';

-- ===== 되돌리기 (문제 생겼을 때만) =====
-- update public.level_test_results r
-- set test_date = b.test_date, exam_title = b.exam_title, assigned_level = b.assigned_level, result_json = b.result_json
-- from public._backup_kimhyeonseong_e6_to_m1 b
-- where r.id = b.id;
