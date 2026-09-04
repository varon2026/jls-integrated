/* ============================================================================
   장안분원 2026 여름 마감 ≠ 가을 학기초 바로잡기
   ----------------------------------------------------------------------------
   처음 본 증상 :  여름 마감 414  /  가을 학기초 415   (1명 차이)

   1명 차이로 보였지만 실제로는 반대 방향 오류 두 개가 섞여 있었다.

       −2  오민서 · 전윤채          여름 재원인데 가을에 '신규생'으로 저장
       +3  정우진 · 정원우 · 정차율  여름 퇴원인데 가을 명단에 남아 있음
       ───
       +1  → 겨우 1명 차이로만 보였다

   ── 조치 (2026-09-04) ────────────────────────────────────────────────────
   ① 오민서 · 전윤채  →  가을 기존생으로 되돌림   ★ 이 파일의 3번이 그 일을 한다
   ② 정우진 · 정원우 · 정차율  →  여름 퇴원생으로 확정.
      운영자가 가을 명단에서 직접 뺐다. SQL 로 할 일이 없어서 이 파일엔 없다.

   ── 결과 ─────────────────────────────────────────────────────────────────
        여름 마감 414  =  가을 학기초 414
   ============================================================================ */


/* ── 왜 엑셀로는 못 고치는가 (오민서 · 전윤채) ───────────────────────────────
   9/4 에 올린 가을 전체명단에는 두 사람의 특이사항 칸이 이미 '빈칸'이었다.
   그런데도 '신규생'이 그대로 남은 이유는 업로드 코드가 이렇게 생겨서다.

       if(note) rec.note = note;                  // 빈칸이면 기존 특이사항을 안 지운다
       if(noteTellsOrigin) rec.origin = origin;   // 빈칸이면 신규/복귀 구분도 안 바꾼다

   일부러 그렇게 만들어 뒀다 — 원무에서 등록한 신규생이, 분원이 특이사항을 비워서
   다시 올렸다는 이유만으로 기존생으로 떨어지면 안 되기 때문이다.
   그래서 엑셀을 아무리 고쳐 올려도 안 고쳐진다. SQL 이 유일한 방법이다.
   한 번 고치면 다시 안 되돌아간다 — 엑셀 쪽이 이미 빈칸이라서.
   ------------------------------------------------------------------------- */

/* ── 왜 정우진 · 정원우 · 정차율은 SQL 이 없는가 ────────────────────────────
   8/30 학기말 퇴원 정리 29명에 섞여 있던 세 명인데, 가을 명단에도 이름이 남아
   있어서 가을 학기초에 3명이 더 잡혔다.
   '여름학기까지만 다니고 안 온 것'이 맞으므로 여름 퇴원이 정답이고,
   운영자가 가을 명단에서 세 명을 빼면서 정리됐다.

   ⚠️ 다음에 같은 일이 생기면 : 가을 전체명단(재원생조회)에 퇴원 열이 없기 때문에
      명단에 이름이 남아 있으면 업로드할 때마다 되살아난다.
          } else if(rec.status==='withdraw' && !rec.transfer){
            rec.status='active'; rec.withdrawDate='';   // ← 여기서 되살아난다
          }
      IMS 에서 퇴원 처리해 재원생조회에서 빠지게 하는 것이 근본 해결이다.
   ------------------------------------------------------------------------- */


/* ★ 1 → 2 → 3 → 4 순서로 한 덩어리씩 실행. 1번은 조회만 한다.
     이 파일이 건드리는 사람 : 오민서 U003247226 · 전윤채 U003256051 (가을 학기만) */


/* ── 1. 조회 — 지금 상태 ─────────────────────────────────────────────────── */

select s.name as 학생, s.code as 회원코드, r.semester_id as 학기,
       r.class_label as 반, r.teacher as 담임, r.status as 상태,
       r.origin as 구분, r.target_type as 상담대상,
       r.enroll_date::text as 입학일, r.note as 특이사항
from public.semester_records r
join public.students s on s.id = r.student_id
where s.code in ('U003247226','U003256051')
  and r.semester_id in ('sem_2026_summer','sem_2026_fall')
  and coalesce(r.kind,'regular') <> 'exam'
order by s.name, r.semester_id;
-- 고치기 전 : 가을 줄의 구분이 'new'(신규) 이고 입학일에 9월 날짜가 들어 있다.


/* ── 2. 백업 ─────────────────────────────────────────────────────────────── */

drop table if exists public.sr_bak_jangan_fall;
create table public.sr_bak_jangan_fall as
select r.* from public.semester_records r
join public.students s on s.id = r.student_id
where s.code in ('U003247226','U003256051')
  and r.semester_id in ('sem_2026_summer','sem_2026_fall');

drop table if exists public.mv_bak_jangan_fall;
create table public.mv_bak_jangan_fall as
select m.* from public.student_movements m
join public.students s on s.id = m.student_id
where s.code in ('U003247226','U003256051')
  and m.semester_id in ('sem_2026_summer','sem_2026_fall');

select (select count(*) from public.sr_bak_jangan_fall) as 명단_백업,
       (select count(*) from public.mv_bak_jangan_fall) as 이동_백업;
-- 명단 4 가 나오면 정상입니다 (2명 × 2학기).


/* ── 3. 수정 — 오민서 · 전윤채 : 가을 신규 → 기존생(학기초) ─────────────── */

/*  여름에 들어온 것은 사실이므로 여름 줄은 절대 건드리지 않는다.
    가을 줄만 —
      origin='start'      신규/복귀 구분을 지운다        → 기존생(재원생)
      target_type='MC'    해피콜(HC) 대상에서 뺀다
      enroll_date=null    입학일을 지운다                → '학기초부터 다닌 학생'
      note=null           남아 있던 '신규생' 글자를 지운다                        */
update public.semester_records r
set origin='start', target_type='MC', enroll_date=null, note=null
from public.students s
where s.id = r.student_id
  and s.code in ('U003247226','U003256051')
  and r.semester_id = 'sem_2026_fall'
  and coalesce(r.kind,'regular') <> 'exam';

/*  인원마감표 '신규' 칸에 계속 뜨지 않도록 가을 신규 이동기록도 지운다 */
delete from public.student_movements m
using public.students s
where s.id = m.student_id
  and s.code in ('U003247226','U003256051')
  and m.semester_id = 'sem_2026_fall' and m.type = 'new';


/* ── 4. 검증 — 여름 마감과 가을 학기초가 같아야 한다 ─────────────────────── */

with b as (select id from public.branches where name like '장안%' limit 1),
su as (select r.* from public.semester_records r join b on r.branch_id=b.id
        where r.semester_id='sem_2026_summer' and coalesce(r.kind,'regular')<>'exam'),
fa as (select r.* from public.semester_records r join b on r.branch_id=b.id
        where r.semester_id='sem_2026_fall'   and coalesce(r.kind,'regular')<>'exam')
select
 (select count(*) from su where status='active')                                as "여름 마감",
 (select count(*) from fa where enroll_date is null or enroll_date::text='')     as "가을 학기초(인원마감표)",
 (select count(*) from fa where status='active')
  + (select count(*) from fa where status='withdraw' and not transfer)
  + (select count(*) from fa where status='withdraw' and transfer)
  - (select count(*) from fa where origin in ('new','return') and not transfer_in)
  - (select count(*) from fa where transfer_in)                                  as "가을 학기초(대시보드)",
 (select count(*) from fa where status='active')                                 as "가을 현재 재원";
/*  ★ 앞의 세 숫자가 전부 같아야 합니다. 2026-09-04 기준으로는 414 였습니다.
    학기초 = 재원 + 퇴원 + 전출 − 신규 − 전입 이라, 인원마감표 방식(입학일이 빈
    학생 세기)과 대시보드 방식이 서로 다른 값을 내면 그 자체가 버그 신호입니다.

    ⚠️ 입학일이 NULL 이 아니라 빈 문자열('') 로 저장된 줄이 아주 많습니다.
       `enroll_date is null` 만 보면 숫자가 통째로 틀립니다. 위처럼 둘 다 보세요. */


/* ── 4-b. 사람별 확인 — 두 명이 제대로 바뀌었는지 눈으로 보기 ──────────── */

select s.name as 학생, r.semester_id as 학기,
       case r.status when 'active' then '재원' when 'withdraw' then '퇴원' else r.status end as 상태,
       case r.origin when 'new' then '신규' when 'return' then '복귀' else '기존생' end as 구분,
       coalesce(nullif(r.enroll_date::text,''),'(학기초)') as 입학일
from public.semester_records r
join public.students s on s.id = r.student_id
where s.code in ('U003247226','U003256051')
  and r.semester_id in ('sem_2026_summer','sem_2026_fall')
  and coalesce(r.kind,'regular') <> 'exam'
order by s.name, r.semester_id;

/*  이렇게 나와야 맞습니다 —

      오민서   여름  재원  신규              ← 여름에 들어온 건 사실이니 그대로
      오민서   가을  재원  기존생  (학기초)   ← 여기가 고쳐지는 곳
      전윤채   여름  재원  신규
      전윤채   가을  재원  기존생  (학기초)   ← 여기가 고쳐지는 곳                */


/* ── 되돌리기 (문제 생겼을 때만) ────────────────────────────────────────────
update public.semester_records r
set status=b.status, origin=b.origin, target_type=b.target_type,
    enroll_date=b.enroll_date, withdraw_date=b.withdraw_date,
    withdraw_reason=b.withdraw_reason, withdraw_memo=b.withdraw_memo,
    transfer=b.transfer, transfer_to=b.transfer_to, note=b.note
from public.sr_bak_jangan_fall b where b.id = r.id;

insert into public.student_movements select * from public.mv_bak_jangan_fall
on conflict (id) do nothing;
   ------------------------------------------------------------------------- */
