-- 2026-11-03 — 운영자: 탕정분원 중1 ACE M1(일반형) 컷라인을 오늘 또 한 번 수정
-- (PA2 35~45 / A1 46~55 / A2 56~67 / MA1 68~  →  PA2 45~55 / A1 56~65 / A2 66~75 / MA1 76~).
-- 이미 답안 입력돼서 저장된 성적표들은 레벨이 옛 기준으로 박혀있으니, 코드만 고쳐선
-- 안 바뀐다. 아래 순서대로(1.조회 → 2.백업 → 3.수정 → 4.검증=0) Supabase SQL Editor에서
-- 하나씩 실행하고, 각 단계 결과를 알려주세요.

-- ===== 1. 조회 — 새 기준으로 레벨이 바뀌는 학생이 몇 명인지 =====
select r.id, r.student_name, r.school, r.grade, r.total_score,
       r.assigned_level as 현재레벨,
       case
         when r.total_score >= 76 then 'MA1'
         when r.total_score >= 66 then 'A2'
         when r.total_score >= 56 then 'A1'
         when r.total_score >= 45 then 'PA2'
         else '미배정'
       end as 새레벨
from public.level_test_results r
where r.exam_title = 'M1(일반형)'
  and r.branch_id = (select id from public.branches where name like '탕정%' limit 1)
  and r.assigned_level <> case
        when r.total_score >= 76 then 'MA1'
        when r.total_score >= 66 then 'A2'
        when r.total_score >= 56 then 'A1'
        when r.total_score >= 45 then 'PA2'
        else '미배정'
      end
order by r.student_name;

-- ===== 2. 백업 — 수정 전 원본을 따로 떼어놓기 (되돌릴 때 씀) =====
create table if not exists public._backup_m1_general_cutline_1103 as
select * from public.level_test_results r
where r.exam_title = 'M1(일반형)'
  and r.branch_id = (select id from public.branches where name like '탕정%' limit 1);

-- ===== 3. 수정 — assigned_level 칼럼 + result_json 안의 assignedLevel 둘 다 =====
update public.level_test_results
set assigned_level = case
      when total_score >= 76 then 'MA1'
      when total_score >= 66 then 'A2'
      when total_score >= 56 then 'A1'
      when total_score >= 45 then 'PA2'
      else '미배정'
    end,
    result_json = jsonb_set(
      result_json, '{assignedLevel}',
      to_jsonb(
        case
          when total_score >= 76 then 'MA1'
          when total_score >= 66 then 'A2'
          when total_score >= 56 then 'A1'
          when total_score >= 45 then 'PA2'
          else '미배정'
        end
      )
    )
where exam_title = 'M1(일반형)'
  and branch_id = (select id from public.branches where name like '탕정%' limit 1)
  and assigned_level <> case
        when total_score >= 76 then 'MA1'
        when total_score >= 66 then 'A2'
        when total_score >= 56 then 'A1'
        when total_score >= 45 then 'PA2'
        else '미배정'
      end;

-- ===== 4. 검증 — 0이 나와야 정상 (더는 바뀔 학생이 없다는 뜻) =====
select count(*) from public.level_test_results
where exam_title = 'M1(일반형)'
  and branch_id = (select id from public.branches where name like '탕정%' limit 1)
  and assigned_level <> case
        when total_score >= 76 then 'MA1'
        when total_score >= 66 then 'A2'
        when total_score >= 56 then 'A1'
        when total_score >= 45 then 'PA2'
        else '미배정'
      end;

-- ===== 되돌리기 (문제 생겼을 때만) =====
-- update public.level_test_results r
-- set assigned_level = b.assigned_level, result_json = b.result_json
-- from public._backup_m1_general_cutline_1103 b
-- where r.id = b.id;
