/* ============================================================================
   온라인 수강 중이던 학생이 '복귀생'으로 잡힌 것 바로잡기 (적용 완료)
   장안분원 2026 여름학기 · 문지우(U003078512) · 이하임(U002974016)
   ----------------------------------------------------------------------------
   무엇이 잘못됐나
     특이사항에 '6~7월온라인만 수강/8월복귀완료' 라고 적었더니
     '복귀' 두 글자에 걸려 복귀생(return)으로 저장됐다. 그 바람에
       ① 여름 학기초에서 빠져 봄 마감 456 ≠ 여름 학기초 454 가 됐고
       ② 신규가 2명 부풀려졌고
       ③ 2025년 가을부터 다니던 학생이 해피콜(HC) 대상이 됐다.
     이 학생들은 학원을 그만둔 적이 없다. 수업 형태만 온라인이었다.

   ★ 이 SQL로 고쳐도 여름 전체명단을 다시 올리면 원상복구된다.
     특이사항에 '복귀'가 그대로 남아 있기 때문이다.
     다시 올려야 하면 엑셀에서 그 두 글자를 빼고 올릴 것.

   ★ 1 → 2 → 3 → 4 순서로 한 덩어리씩 실행. 1번은 조회만 한다.
   ============================================================================ */


/* ── 1. 조회 ─────────────────────────────────────────────────────────────── */

select b.name as 분원, r.semester_id as 학기, s.name as 학생, s.code as 회원코드,
       r.class_label as 반, r.teacher as 담임, r.status as 상태,
       r.origin as 지금_구분, r.target_type as 지금_상담대상,
       r.enroll_date::text as 지금_입학일, r.note as 특이사항
from public.semester_records r
join public.students s on s.id = r.student_id
left join public.branches b on b.id = r.branch_id
where s.code in ('U003078512','U002974016')
  and r.semester_id = 'sem_2026_summer'
  and coalesce(r.kind,'regular') <> 'exam';

select b.name as 분원, m.semester_id as 학기, s.name as 학생,
       m.type as 이동종류, m.date as 날짜, m.memo as 메모
from public.student_movements m
join public.students s on s.id = m.student_id
left join public.branches b on b.id = m.branch_id
where s.code in ('U003078512','U002974016')
  and m.semester_id = 'sem_2026_summer';


/* ── 2. 백업 ─────────────────────────────────────────────────────────────── */

drop table if exists public.sr_bak_online_return;
create table public.sr_bak_online_return as
select r.* from public.semester_records r
join public.students s on s.id = r.student_id
where s.code in ('U003078512','U002974016')
  and r.semester_id = 'sem_2026_summer';

drop table if exists public.mv_bak_online_return;
create table public.mv_bak_online_return as
select m.* from public.student_movements m
join public.students s on s.id = m.student_id
where s.code in ('U003078512','U002974016')
  and m.semester_id = 'sem_2026_summer' and m.type = 'return';

select (select count(*) from public.sr_bak_online_return) as 명단_백업,
       (select count(*) from public.mv_bak_online_return) as 이동_백업;


/* ── 3. 수정 ─────────────────────────────────────────────────────────────── */

-- 3-a. 기존생으로 되돌리고, 입학일을 비워 학기초로
update public.semester_records r
set origin='start', target_type='MC', enroll_date=null
from public.students s
where s.id = r.student_id
  and s.code in ('U003078512','U002974016')
  and r.semester_id = 'sem_2026_summer'
  and coalesce(r.kind,'regular') <> 'exam';

-- 3-b. 같이 생긴 '복귀' 이동기록 삭제
delete from public.student_movements m
using public.students s
where s.id = m.student_id
  and s.code in ('U003078512','U002974016')
  and m.semester_id = 'sem_2026_summer'
  and m.type = 'return';


/* ── 4. 검증 — 셋 다 456 이어야 한다 ───────────────────────────────────────
   ★ enroll_date 는 NULL 이 아니라 빈 문자열('')로 저장된 행이 많다.
     is null 만 보면 안 되고 ='' 도 같이 봐야 한다. (앱은 둘 다 '학기초'로 읽는다) */

with b as (select id from public.branches where name like '장안%' limit 1),
sp as (select r.* from public.semester_records r join b on r.branch_id=b.id
        where r.semester_id='sem_2026_spring' and coalesce(r.kind,'regular')<>'exam'),
su as (select r.* from public.semester_records r join b on r.branch_id=b.id
        where r.semester_id='sem_2026_summer' and coalesce(r.kind,'regular')<>'exam')
select
 (select count(*) from sp where status='active')                              as "봄 마감",
 (select count(*) from su where enroll_date is null or enroll_date::text='')  as "여름 학기초(인원마감표)",
 (select count(*) from su where status='active')
  + (select count(*) from su where status='withdraw' and not transfer)
  + (select count(*) from su where status='withdraw' and transfer)
  - (select count(*) from su where origin in ('new','return') and not transfer_in)
  - (select count(*) from su where transfer_in)                               as "여름 학기초(대시보드)";


/* ── 아직 안 고친 것 — 분원 확인 뒤에 같은 방식으로 ──────────────────────────
   '직전 학기에 재원인데 이번 학기 신규·복귀로 올라온 학생' 이 전 분원에 9건 있었다.
   그중 2건(위)만 고쳤다. 나머지 7건은 진짜 퇴원했다 돌아온 건지 분원 확인이 필요하다.
     수원   최시원  가을 9/1  '신규생'      · 직전 여름 재원
     장안   오민서  가을 9/1  '신규생'      · 직전 여름 재원
     장안   전윤채  가을 9/1  '신규생'      · 직전 여름 재원
     운정2  김주원  겨울 2/1  '2월시작신규' · 직전 가을 재원
     운정2  박다은  겨울 2/1  '2월시작신규' · 직전 가을 재원
     서수원 오윤진  여름 8/3  (특이사항 없음) · 직전 봄 재원
     장안   신희우  봄  5/12 (특이사항 없음) · 직전 겨울 재원
   진짜 퇴원했던 거라면 명단만 고치면 안 되고 직전 학기에 퇴원 처리도 넣어야 한다.
   ------------------------------------------------------------------------- */


/* ── 되돌리기 (문제 생겼을 때만) ────────────────────────────────────────────
update public.semester_records r
set origin=b.origin, target_type=b.target_type, enroll_date=b.enroll_date
from public.sr_bak_online_return b where b.id = r.id;

insert into public.student_movements select * from public.mv_bak_online_return
on conflict (id) do nothing;
   ------------------------------------------------------------------------- */
