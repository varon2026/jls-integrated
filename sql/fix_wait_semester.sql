/* ============================================================================
   대기 학기가 한 학기 뒤로 밀려 저장된 예약 바로잡기
   ----------------------------------------------------------------------------
   무엇이 잘못됐나
     예전 코드는 '다음학기 대기'의 학기를 시험 본 날이 아니라 '오늘' 기준으로
     계산했다. 그래서 8월(여름학기)에 시험 본 학생을 9월에 처리하면
     가을이 아니라 겨울 대기로 저장됐다.
     코드는 2026-09-01 에 고쳤지만(시험 본 날 기준), 이미 저장된 값은
     "진짜로 겨울 대기인 학생이 있을 수 있어서" 일부러 건드리지 않았다.

   왜 고쳐야 하나
     전형 현황은 대기 학기로 학생을 갈라 담는다. 학기가 밀려 있으면
     그 학생이 가을 전형에서 빠지고 겨울 전형에 잡혀, 두 학기 등록률이 다 틀어진다.

   무엇을 바꾸나
     '시험 본 학기의 다음 학기'로 되돌린다.
     (여름 시험 → 가을,  가을 시험 → 겨울,  겨울 시험 → 봄)
     ★ 시험 학기의 바로 다음 학기(차이 1)와 같은 학기(차이 0)는 정상이라 건드리지 않는다.
       두 학기 이상 벌어진 것(차이 2 이상)만 고친다.

   ★ 1 → 2 → 3 → 4 순서로 한 덩어리씩 실행하세요. 1번은 조회만 합니다.
     1번 결과에 '진짜로 그 학기 대기가 맞는' 학생이 섞여 있으면 3번을 돌리지 말고
     그 학생만 홈페이지에서 직접 고치세요 (응시자 상세 › 학기 칩을 누르면 바뀝니다).
   ============================================================================ */


/* ── 공통: 학기를 순번으로 바꾸는 식 (연도*4 + 봄0 여름1 가을2 겨울3) ─────── */

create or replace view public.v_wait_semester_check as
select r.id,
       b.name                       as 분원,
       r.student_name               as 학생,
       r.reserved_date::date        as 시험일,
       r.enrolled                   as 등록여부,
       r.wait_semester              as 저장된_대기학기,
       (case
          when extract(month from r.reserved_date::date) between 3 and 5  then extract(year from r.reserved_date::date)::int*4 + 0
          when extract(month from r.reserved_date::date) between 6 and 8  then extract(year from r.reserved_date::date)::int*4 + 1
          when extract(month from r.reserved_date::date) between 9 and 11 then extract(year from r.reserved_date::date)::int*4 + 2
          when extract(month from r.reserved_date::date) = 12             then extract(year from r.reserved_date::date)::int*4 + 3
          else (extract(year from r.reserved_date::date)::int - 1)*4 + 3
        end)                        as 시험_순번,
       ( (split_part(r.wait_semester,'_',2))::int*4
         + case split_part(r.wait_semester,'_',3)
             when 'spring' then 0 when 'summer' then 1 when 'fall' then 2 else 3 end ) as 대기_순번
from public.level_test_reservations r
left join public.branches b on b.id = r.branch_id
where r.wait_semester is not null and r.reserved_date is not null;


/* ── 1. 조회 — 무엇이 바뀔지 먼저 눈으로 확인 ───────────────────────────── */

select 분원, 학생, 시험일, 등록여부, 저장된_대기학기,
       (대기_순번 - 시험_순번) as 몇학기_뒤로_밀렸나,
       'sem_' || ((시험_순번+1)/4) || '_' ||
       (case (시험_순번+1)%4 when 0 then 'spring' when 1 then 'summer'
                             when 2 then 'fall'   else 'winter' end) as 바뀔_대기학기
from public.v_wait_semester_check
where 대기_순번 - 시험_순번 >= 2
order by 분원, 시험일;

-- ↑ 여기 나온 학생 중 '진짜로 그 학기 대기가 맞는' 사람이 있으면 3번을 돌리지 마세요.


/* ── 2. 백업 ─────────────────────────────────────────────────────────────── */

drop table if exists public.lt_res_bak_waitsem;
create table public.lt_res_bak_waitsem as
select r.id, r.student_name, r.reserved_date, r.enrolled, r.wait_semester
from public.level_test_reservations r
join public.v_wait_semester_check v on v.id = r.id
where v.대기_순번 - v.시험_순번 >= 2;

select count(*) as 백업된_행 from public.lt_res_bak_waitsem;


/* ── 3. 수정 — 시험 본 학기의 다음 학기로 되돌린다 ──────────────────────── */

update public.level_test_reservations r
set wait_semester = 'sem_' || ((v.시험_순번+1)/4) || '_' ||
    (case (v.시험_순번+1)%4 when 0 then 'spring' when 1 then 'summer'
                            when 2 then 'fall'   else 'winter' end)
from public.v_wait_semester_check v
where v.id = r.id and v.대기_순번 - v.시험_순번 >= 2;


/* ── 4. 검증 — 0 이어야 한다 ─────────────────────────────────────────────── */

select count(*) as 아직_밀려있는_건
from public.v_wait_semester_check
where 대기_순번 - 시험_순번 >= 2;


/* ── 되돌리기 (문제 생겼을 때만) ────────────────────────────────────────────
update public.level_test_reservations r
set wait_semester = b.wait_semester
from public.lt_res_bak_waitsem b
where b.id = r.id;
   ------------------------------------------------------------------------- */


/* ── 뒷정리 (다 끝난 뒤에) ──────────────────────────────────────────────────
drop view if exists public.v_wait_semester_check;
   ------------------------------------------------------------------------- */
