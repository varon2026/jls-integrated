-- ============================================================================
--  대기 학기가 한 학기 뒤로 밀린 예약 찾아서 고치기
--
--  왜 생겼나
--    '다음학기 대기'를 누르면 대기 학기를 '오늘' 기준으로 계산했다.
--    8월(여름학기)에 시험 본 학생을 9월에 눌렀더니, 오늘의 현재학기가 가을이라
--    다음 학기가 겨울로 저장됐다. 가을이 맞다.
--    앱 코드는 이미 '시험 본 날' 기준으로 고쳤다(7b76cb5). 이 스크립트는
--    그 전에 잘못 저장된 것만 되돌린다.
--
--  ★ [1]번 조회부터 돌려서 목록을 눈으로 보세요.
--    진짜로 한 학기 건너뛰고 기다리는 학생이 섞여 있을 수 있습니다.
--    [3]번 수정은 그 목록을 확인한 뒤에 돌리세요.
-- ============================================================================


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ [1] 조회 — 먼저 이것만 돌려서 몇 건인지, 누구인지 확인                    │
-- └──────────────────────────────────────────────────────────────────────────┘
with base as (
  select r.id, r.branch_id, r.student_name, r.school, r.grade,
         r.enrolled, r.status, r.wait_semester,
         substring(r.reserved_date::text, 1, 10)::date as d
    from public.level_test_reservations r
   where r.wait_semester is not null
     and r.reserved_date is not null
),
sem as (
  select b.*,
         case when extract(month from d)::int in (3,4,5)   then 'spring'
              when extract(month from d)::int in (6,7,8)   then 'summer'
              when extract(month from d)::int in (9,10,11) then 'fall'
              else 'winter' end as season,
         case when extract(month from d)::int in (1,2)
              then extract(year from d)::int - 1
              else extract(year from d)::int end as sy
    from base b
),
calc as (
  select s.*,
         -- 시험 본 학기의 '다음 학기' = 있어야 할 값
         case season when 'spring' then 'sem_' || sy     || '_summer'
                     when 'summer' then 'sem_' || sy     || '_fall'
                     when 'fall'   then 'sem_' || sy     || '_winter'
                     else               'sem_' || (sy+1) || '_spring' end as should_be,
         -- 딱 한 학기 밀린 값 = 이번 버그의 지문
         case season when 'spring' then 'sem_' || sy     || '_fall'
                     when 'summer' then 'sem_' || sy     || '_winter'
                     when 'fall'   then 'sem_' || (sy+1) || '_spring'
                     else               'sem_' || (sy+1) || '_summer' end as one_late
    from sem s
)
select
  coalesce(br.name, c.branch_id) as 분원,
  c.student_name                 as 학생,
  c.d                            as 응시일,
  c.enrolled                     as 등록상태,
  c.wait_semester                as 저장된_대기학기,
  c.should_be                    as 있어야_할_학기,
  case when c.wait_semester = c.should_be then '정상'
       when c.wait_semester = c.one_late  then '★ 한 학기 밀림 (고칠 대상)'
       else '다름 — 사람이 일부러 바꾼 듯, 손대지 말 것' end as 판정,
  c.id                           as 예약id
from calc c
left join public.branches br on br.id = c.branch_id
where c.wait_semester <> c.should_be
order by 판정, 분원, c.d, c.student_name;


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ [2] 백업 — 고치기 전에 지금 값을 통째로 떠 둔다 (되돌리기용)              │
-- └──────────────────────────────────────────────────────────────────────────┘
-- drop table if exists public.wait_sem_backup_20260901;
-- create table public.wait_sem_backup_20260901 as
--   select id, wait_semester, now() as backed_up_at
--     from public.level_test_reservations
--    where wait_semester is not null;


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ [3] 수정 — '한 학기 밀림'인 것만, 아직 대기 중인 학생만                   │
-- │     ※ [1] 목록 확인하고 [2] 백업 뜬 다음에 돌리세요                       │
-- └──────────────────────────────────────────────────────────────────────────┘
-- with base as (
--   select r.id, r.wait_semester,
--          substring(r.reserved_date::text, 1, 10)::date as d
--     from public.level_test_reservations r
--    where r.enrolled = 'waiting_next'        -- ← 아직 대기 중인 학생만
--      and r.wait_semester is not null
--      and r.reserved_date is not null
-- ),
-- sem as (
--   select b.*,
--          case when extract(month from d)::int in (3,4,5)   then 'spring'
--               when extract(month from d)::int in (6,7,8)   then 'summer'
--               when extract(month from d)::int in (9,10,11) then 'fall'
--               else 'winter' end as season,
--          case when extract(month from d)::int in (1,2)
--               then extract(year from d)::int - 1
--               else extract(year from d)::int end as sy
--     from base b
-- ),
-- calc as (
--   select s.*,
--          case season when 'spring' then 'sem_' || sy     || '_summer'
--                      when 'summer' then 'sem_' || sy     || '_fall'
--                      when 'fall'   then 'sem_' || sy     || '_winter'
--                      else               'sem_' || (sy+1) || '_spring' end as should_be,
--          case season when 'spring' then 'sem_' || sy     || '_fall'
--                      when 'summer' then 'sem_' || sy     || '_winter'
--                      when 'fall'   then 'sem_' || (sy+1) || '_spring'
--                      else               'sem_' || (sy+1) || '_summer' end as one_late
--     from sem s
-- )
-- update public.level_test_reservations r
--    set wait_semester = c.should_be
--   from calc c
--  where r.id = c.id
--    and c.wait_semester = c.one_late;     -- 딱 한 학기 밀린 것만


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 되돌리기 (백업을 떴을 때만)                                              │
-- └──────────────────────────────────────────────────────────────────────────┘
-- update public.level_test_reservations r
--    set wait_semester = b.wait_semester
--   from public.wait_sem_backup_20260901 b
--  where r.id = b.id;
