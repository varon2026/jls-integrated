/* ============================================================================
   탕정분원(br_22jcktj) ACE M1(일반형) — 35~44점을 PA1로 (이미 나온 성적표 정정)
   ----------------------------------------------------------------------------
   왜: 2026-11-12 운영자 요청으로 탕정분원 M1(일반형) 기준표에 PA1(35~44점)이 생겼다
       (leveltest/common.js getAssignedLevel). 코드는 새로 채점하는 것부터만 바뀌므로,
       예전에 저장된 성적표(level_test_results)와 예약(level_test_reservations)의
       '미배정'을 여기서 PA1로 바꾼다.

   무엇을 바꾸나
     · 탕정분원 · M1(일반형) · 총점 35~44 · 지금 레벨이 비었거나 '미배정'인 건만.
     · 운영자가 성적표에서 직접 레벨을 고쳐 둔 건(미배정이 아닌 값)은 건드리지 않는다.
     · M1(수능형)은 대상이 아니다(점수 체계가 다름).
     · level_test_results 의 assigned_level 과 result_json 안의 assignedLevel(성적표 화면이
       읽는 값)을 같이 바꾸고, 연결된 예약의 test_level 도 같이 바꾼다.

   ★ 0 → 1 → 2 → 3 → 4 순서로 한 덩어리씩 실행하세요.
     0·1번은 조회만 합니다. 1번에 뜬 학생 목록이 맞는지 보고 나서 2번부터 이어서 돌리세요.
   ============================================================================ */


/* ── 0. result_json 칼럼 종류 확인 (jsonb 라고 나와야 아래 3번이 그대로 돈다) ─── */
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'level_test_results'
  and column_name in ('result_json','assigned_level','total_score','exam_title','exam_key');
-- ⚠️ result_json 이 jsonb 가 아니라 json 이면 3번의 `::jsonb` 뒤에 `::json` 을 붙이고,
--    text 면 `::text` 를 붙이세요(저장 형식 그대로 돌려놓기 위함).


/* ── 1. 조회 — 바뀔 대상 (탕정 · M1 일반형 · 35~44점 · 미배정) ───────────────── */

select r.id, r.student_name, r.school, r.grade, r.test_date,
       r.exam_key, r.exam_title, r.total_score, r.assigned_level,
       r.result_json->>'assignedLevel' as json_level, r.reservation_id
from public.level_test_results r
where r.branch_id = 'br_22jcktj'
  and (r.exam_title ilike 'M1%' or r.exam_key ilike 'M1%')
  and coalesce(r.exam_title,'') not like '%수능%' and coalesce(r.exam_key,'') not like '%수능%'
  and r.total_score >= 35 and r.total_score < 45
  and coalesce(nullif(r.assigned_level,''),'미배정') = '미배정'
order by r.test_date, r.student_name;

-- 참고: 같은 점수대인데 대상에서 빠진 건(이미 다른 레벨이 들어간 것) — 운영자가 직접 고친 값이라 그대로 둡니다.
select r.id, r.student_name, r.test_date, r.exam_title, r.total_score, r.assigned_level
from public.level_test_results r
where r.branch_id = 'br_22jcktj'
  and (r.exam_title ilike 'M1%' or r.exam_key ilike 'M1%')
  and r.total_score >= 35 and r.total_score < 45
  and coalesce(nullif(r.assigned_level,''),'미배정') <> '미배정'
order by r.test_date, r.student_name;


/* ── 2. 백업 — 바꾸기 전 원본을 그대로 복사해 둔다 ─────────────────────────────── */

create table public.bak_ltr_tj_m1_pa1_20261112 as
select r.*
from public.level_test_results r
where r.branch_id = 'br_22jcktj'
  and (r.exam_title ilike 'M1%' or r.exam_key ilike 'M1%')
  and coalesce(r.exam_title,'') not like '%수능%' and coalesce(r.exam_key,'') not like '%수능%'
  and r.total_score >= 35 and r.total_score < 45
  and coalesce(nullif(r.assigned_level,''),'미배정') = '미배정';

create table public.bak_ltres_tj_m1_pa1_20261112 as
select v.*
from public.level_test_reservations v
where v.id in (select reservation_id from public.bak_ltr_tj_m1_pa1_20261112 where reservation_id is not null);

select (select count(*) from public.bak_ltr_tj_m1_pa1_20261112)   as 백업_성적표,
       (select count(*) from public.bak_ltres_tj_m1_pa1_20261112) as 백업_예약;


/* ── 3. 수정 ────────────────────────────────────────────────────────────────── */

update public.level_test_results r
set assigned_level = 'PA1',
    result_json    = jsonb_set(r.result_json::jsonb, '{assignedLevel}', '"PA1"'::jsonb)
where r.id in (select id from public.bak_ltr_tj_m1_pa1_20261112);

update public.level_test_reservations v
set test_level = 'PA1'
where v.id in (select reservation_id from public.bak_ltr_tj_m1_pa1_20261112 where reservation_id is not null)
  and coalesce(nullif(v.test_level,''),'미배정') = '미배정';


/* ── 4. 검증 — 둘 다 0 이어야 합니다 ─────────────────────────────────────────── */

select count(*) as 아직_미배정_성적표
from public.level_test_results r
where r.id in (select id from public.bak_ltr_tj_m1_pa1_20261112)
  and (r.assigned_level <> 'PA1' or r.result_json->>'assignedLevel' <> 'PA1');

select count(*) as 아직_미배정_예약
from public.level_test_reservations v
where v.id in (select id from public.bak_ltres_tj_m1_pa1_20261112)
  and coalesce(v.test_level,'') <> 'PA1';


/* ── 되돌리기 (필요할 때만) ──────────────────────────────────────────────────── */
-- update public.level_test_results r set assigned_level = b.assigned_level, result_json = b.result_json
--   from public.bak_ltr_tj_m1_pa1_20261112 b where b.id = r.id;
-- update public.level_test_reservations v set test_level = b.test_level
--   from public.bak_ltres_tj_m1_pa1_20261112 b where b.id = v.id;
