/* ============================================================================
   장안분원 여름 마감 414 ≠ 가을 학기초 415 바로잡기 (5명)
   ----------------------------------------------------------------------------
   두 가지 오류가 반대 방향이라 1명 차이로 작아 보였을 뿐이다.

     여름 마감                                       414
       − 오민서 · 전윤채       (여름 재원인데 가을 신규)   −2  →  412
       + 정우진 · 정원우 · 정차율 (여름 퇴원인데 가을 학기초) +3  →  415

   ── 오민서 · 전윤채 (가을 신규 → 기존생)
      2026 여름에 멀쩡히 재원이었는데 가을 명단에 '신규생'으로 저장됐다.
      ★ 오늘(2026-09-04) 올린 가을 전체명단에는 특이사항이 빈칸이다.
        그런데도 안 고쳐진 이유 —
          if(note) rec.note=note;                 // 빈칸이면 기존 값을 안 지운다
          if(noteTellsOrigin) rec.origin=origin;  // 빈칸이면 구분도 안 바꾼다
        일부러 그렇게 만들어 뒀다(원무에서 등록한 신규생이 빈칸 재업로드로 떨어지면 안 되니까).
        그래서 엑셀을 고쳐도 안 고쳐진다. SQL 로만 고칠 수 있다.
        한 번 고치면 다시 안 되돌아간다 — 엑셀이 이미 빈칸이라서.

   ── 정우진 · 정원우 · 정차율 (여름 퇴원 → 가을 퇴원)
      8/30 학기말 퇴원 정리 29명에 섞여 여름학기 퇴원으로 저장됐다.
      8월 말까지는 다녔으니 여름 마감 인원에 들어가야 하고,
      9월부터 안 오니 퇴원은 가을학기로 잡아야 한다.
      → 여름은 재원으로 되돌리고, 가을에 퇴원으로 넣는다.

   ★ 1 → 2 → 3 → 4 순서로 한 덩어리씩 실행. 1번은 조회만 한다.
   ============================================================================ */

/* 이 SQL 이 다루는 5명
     오민서 U003247226 · 전윤채 U003256051          — 가을 신규 → 기존생
     정우진 U002758523 · 정원우 U002899034 · 정차율 U003074534 — 여름 퇴원 → 가을 퇴원  */


/* ── 1. 조회 — 지금 상태 ─────────────────────────────────────────────────── */

select s.name as 학생, s.code as 회원코드, r.semester_id as 학기,
       r.class_label as 반, r.teacher as 담임, r.status as 상태,
       r.origin as 구분, r.target_type as 상담대상,
       r.enroll_date::text as 입학일, r.withdraw_date::text as 퇴원일,
       r.withdraw_reason as 퇴원사유, r.note as 특이사항
from public.semester_records r
join public.students s on s.id = r.student_id
where s.code in ('U003247226','U003256051','U002758523','U002899034','U003074534')
  and r.semester_id in ('sem_2026_summer','sem_2026_fall')
  and coalesce(r.kind,'regular') <> 'exam'
order by s.name, r.semester_id;


/* ── 2. 백업 ─────────────────────────────────────────────────────────────── */

drop table if exists public.sr_bak_jangan_fall;
create table public.sr_bak_jangan_fall as
select r.* from public.semester_records r
join public.students s on s.id = r.student_id
where s.code in ('U003247226','U003256051','U002758523','U002899034','U003074534')
  and r.semester_id in ('sem_2026_summer','sem_2026_fall');

drop table if exists public.mv_bak_jangan_fall;
create table public.mv_bak_jangan_fall as
select m.* from public.student_movements m
join public.students s on s.id = m.student_id
where s.code in ('U003247226','U003256051','U002758523','U002899034','U003074534')
  and m.semester_id in ('sem_2026_summer','sem_2026_fall');

select (select count(*) from public.sr_bak_jangan_fall) as 명단_백업,
       (select count(*) from public.mv_bak_jangan_fall) as 이동_백업;
-- 명단 10 이 나오면 정상입니다 (5명 × 2학기).


/* ── 3. 수정 ─────────────────────────────────────────────────────────────── */

-- 3-a. 오민서 · 전윤채 : 가을 신규 → 기존생 (학기초로)
update public.semester_records r
set origin='start', target_type='MC', enroll_date=null, note=null
from public.students s
where s.id = r.student_id
  and s.code in ('U003247226','U003256051')
  and r.semester_id = 'sem_2026_fall'
  and coalesce(r.kind,'regular') <> 'exam';

delete from public.student_movements m
using public.students s
where s.id = m.student_id
  and s.code in ('U003247226','U003256051')
  and m.semester_id = 'sem_2026_fall' and m.type = 'new';

-- 3-b. 정우진 · 정원우 · 정차율 : 여름 퇴원 취소 (8월 말까지 다녔으므로 재원)
update public.semester_records r
set status='active', withdraw_date='', withdraw_reason=null, withdraw_memo=null,
    transfer=false, transfer_to=null
from public.students s
where s.id = r.student_id
  and s.code in ('U002758523','U002899034','U003074534')
  and r.semester_id = 'sem_2026_summer'
  and coalesce(r.kind,'regular') <> 'exam';

delete from public.student_movements m
using public.students s
where s.id = m.student_id
  and s.code in ('U002758523','U002899034','U003074534')
  and m.semester_id = 'sem_2026_summer' and m.type = 'withdraw';

-- 3-c. 정우진 · 정원우 · 정차율 : 가을에 퇴원으로
--      ★ 퇴원일이 9/1 이 아니면 아래 두 군데 날짜를 실제 날짜로 바꾸세요.
update public.semester_records r
set status='withdraw', withdraw_date='2026-09-01',
    withdraw_reason='personal', withdraw_memo='여름학기까지 수강 후 미등록',
    transfer=false, transfer_to=null
from public.students s
where s.id = r.student_id
  and s.code in ('U002758523','U002899034','U003074534')
  and r.semester_id = 'sem_2026_fall'
  and coalesce(r.kind,'regular') <> 'exam';

insert into public.student_movements (id, student_id, branch_id, semester_id, type, date, memo)
select 'mv_jf_'||substr(md5(random()::text),1,7), r.student_id, r.branch_id, r.semester_id,
       'withdraw', '2026-09-01', '[개인사정] 여름학기까지 수강 후 미등록'
from public.semester_records r
join public.students s on s.id = r.student_id
where s.code in ('U002758523','U002899034','U003074534')
  and r.semester_id = 'sem_2026_fall'
  and coalesce(r.kind,'regular') <> 'exam'
  and not exists (select 1 from public.student_movements m
                  where m.student_id=r.student_id and m.semester_id=r.semester_id and m.type='withdraw');


/* ── 4. 검증 — 둘 다 417 이어야 한다 ────────────────────────────────────── */

with b as (select id from public.branches where name like '장안%' limit 1),
su as (select r.* from public.semester_records r join b on r.branch_id=b.id
        where r.semester_id='sem_2026_summer' and coalesce(r.kind,'regular')<>'exam'),
fa as (select r.* from public.semester_records r join b on r.branch_id=b.id
        where r.semester_id='sem_2026_fall'   and coalesce(r.kind,'regular')<>'exam')
select
 (select count(*) from su where status='active')                               as "여름 마감",
 (select count(*) from su where status='withdraw' and not transfer)            as "여름 퇴원",
 (select count(*) from fa where enroll_date is null or enroll_date::text='')    as "가을 학기초(인원마감표)",
 (select count(*) from fa where status='active')
  + (select count(*) from fa where status='withdraw' and not transfer)
  + (select count(*) from fa where status='withdraw' and transfer)
  - (select count(*) from fa where origin in ('new','return') and not transfer_in)
  - (select count(*) from fa where transfer_in)                                 as "가을 학기초(대시보드)",
 (select count(*) from fa where status='withdraw' and not transfer)             as "가을 퇴원",
 (select count(*) from fa where status='active')                                as "가을 현재 재원";
-- 여름 마감 417 · 여름 퇴원 26 · 가을 학기초 417 · 417 · 가을 퇴원 3


/* ── 4-b. 사람별 확인 — 5명이 제대로 바뀌었는지 눈으로 보기 ───────────────── */

select s.name as 학생, r.semester_id as 학기,
       case r.status when 'active' then '재원' when 'withdraw' then '퇴원' else r.status end as 상태,
       case r.origin when 'new' then '신규' when 'return' then '복귀' else '기존생' end as 구분,
       coalesce(nullif(r.enroll_date::text,''),'(학기초)') as 입학일,
       coalesce(nullif(r.withdraw_date::text,''),'-')       as 퇴원일
from public.semester_records r
join public.students s on s.id = r.student_id
where s.code in ('U003247226','U003256051','U002758523','U002899034','U003074534')
  and r.semester_id in ('sem_2026_summer','sem_2026_fall')
  and coalesce(r.kind,'regular') <> 'exam'
order by s.name, r.semester_id;

/*  이렇게 나와야 맞습니다 —

    오민서   여름  재원  신규    (여름에 들어온 게 맞으니 그대로 둡니다)
    오민서   가을  재원  기존생  (학기초)     ← 여기가 고쳐지는 곳
    전윤채   여름  재원  신규
    전윤채   가을  재원  기존생  (학기초)     ← 여기가 고쳐지는 곳

    정우진   여름  재원  ...     -            ← 여름은 다닌 걸로
    정우진   가을  퇴원  ...     2026-09-01   ← 퇴원은 가을로
    (정원우 · 정차율도 같은 모양)                                            */


/* ── 되돌리기 (문제 생겼을 때만) ────────────────────────────────────────────
update public.semester_records r
set status=b.status, origin=b.origin, target_type=b.target_type,
    enroll_date=b.enroll_date, withdraw_date=b.withdraw_date,
    withdraw_reason=b.withdraw_reason, withdraw_memo=b.withdraw_memo,
    transfer=b.transfer, transfer_to=b.transfer_to, note=b.note
from public.sr_bak_jangan_fall b where b.id = r.id;

delete from public.student_movements where id like 'mv_jf_%';
insert into public.student_movements select * from public.mv_bak_jangan_fall
on conflict (id) do nothing;
   ------------------------------------------------------------------------- */


/* ── ⚠️ 고친 뒤에 꼭 하실 것 ────────────────────────────────────────────────
   정우진·정원우·정차율을 IMS 에서도 퇴원 처리하세요.

   가을 전체명단(재원생조회)에는 퇴원 열이 아예 없습니다. 그래서 이 셋이 명단에
   '수업중'으로 남아 있으면, 다음에 전체명단을 올릴 때 퇴원이 자동으로 풀립니다.
       } else if(rec.status==='withdraw' && !rec.transfer){
         rec.status='active'; rec.withdrawDate='';   // ← 여기서 되살아난다
       }
   IMS 에서 퇴원 처리하면 재원생조회에서 빠지므로 그런 일이 없습니다.
   ------------------------------------------------------------------------- */
