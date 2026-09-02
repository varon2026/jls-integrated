/* ============================================================================
   해피콜(HC) 대상이 잘못 잡힌 학기레코드 복구
   ----------------------------------------------------------------------------
   무엇이 잘못됐나
     ① 명단 업로드가 특이사항에서 '신규' 네 글자만 찾았다.
        '신입생' '9월 신규생' '복귀생' 이라고 쓴 학생은 기존생(start)으로 떨어졌고,
        해피콜을 다 해놓고도 상담률에 안 잡혔다.
     ② 재업로드가 origin(신규 배지)은 안 건드리면서 target_type(HC 대상)만 덮어썼다.
        그래서 '신규 배지는 붙어 있는데 HC 대상은 아님' 인 레코드가 생겼다.

   이 스크립트는 두 가지를 되돌린다.
     · 특이사항이 신규·복귀를 말하는데 origin이 start인 레코드 → 신규/복귀로
     · target_type을 항상 origin과 맞춤 (신규·복귀 = HCMC, 나머지 = MC)

   ★ 1 → 2 → 3 순서로 한 덩어리씩 실행하세요. 1번은 조회만 합니다.
   ============================================================================ */


/* ── 1. 조회 — 무엇이 바뀔지 먼저 눈으로 확인 ───────────────────────────── */

-- 1-a. 특이사항은 신규·복귀인데 기존생으로 들어간 레코드
select b.name as 분원, r.semester_id as 학기, s.name as 학생, s.code as 회원코드,
       r.class_label as 반, r.note as 특이사항,
       r.origin as 지금_구분, r.target_type as 지금_HC대상,
       case when r.note ~ '복귀|재등록|재입학|재입회' then 'return' else 'new' end as 바뀔_구분
from public.semester_records r
join public.students s on s.id = r.student_id
left join public.branches b on b.id = r.branch_id
where coalesce(r.origin,'') not in ('new','return')
  and (r.note ~ '신규|신입|복귀|재등록|재입학|재입회' or r.transfer_in)
order by b.name, r.semester_id, s.name;

-- 1-b. origin과 target_type이 어긋난 레코드 (신규인데 HC 대상이 아님 / 그 반대)
select b.name as 분원, r.semester_id as 학기, s.name as 학생, s.code as 회원코드,
       r.class_label as 반, r.note as 특이사항,
       r.origin as 구분, r.target_type as 지금_HC대상,
       case when r.origin in ('new','return') then 'HCMC' else 'MC' end as 바뀔_HC대상
from public.semester_records r
join public.students s on s.id = r.student_id
left join public.branches b on b.id = r.branch_id
where coalesce(r.target_type,'') <> (case when r.origin in ('new','return') then 'HCMC' else 'MC' end)
order by b.name, r.semester_id, s.name;


/* ── 2. 백업 — 되돌릴 수 있게 원본을 통째로 떠 둔다 ─────────────────────── */

drop table if exists public.semester_records_bak_hcfix;
create table public.semester_records_bak_hcfix as
select * from public.semester_records;

-- 백업 행수 확인 (원본과 같아야 함)
select (select count(*) from public.semester_records)            as 원본,
       (select count(*) from public.semester_records_bak_hcfix)  as 백업;


/* ── 3. 수정 ─────────────────────────────────────────────────────────────── */

-- 3-a. 특이사항이 신규·복귀를 말하는데 기존생으로 들어간 것 → 제자리로
--      (복귀가 우선. '9월 복귀생'처럼 앞에 달이 붙어도 잡힌다)
update public.semester_records
set origin = case when note ~ '복귀|재등록|재입학|재입회' then 'return' else 'new' end
where coalesce(origin,'') not in ('new','return')
  and (note ~ '신규|신입|복귀|재등록|재입학|재입회' or transfer_in);

-- 3-b. HC 대상 여부를 구분(origin)과 항상 일치시킨다
update public.semester_records
set target_type = case when origin in ('new','return') then 'HCMC' else 'MC' end
where coalesce(target_type,'') <> (case when origin in ('new','return') then 'HCMC' else 'MC' end);


/* ── 4. 검증 — 둘 다 0 이어야 한다 ──────────────────────────────────────── */

select
  (select count(*) from public.semester_records
    where coalesce(origin,'') not in ('new','return')
      and (note ~ '신규|신입|복귀|재등록|재입학|재입회' or transfer_in))          as 아직_기존생인_신규,
  (select count(*) from public.semester_records
    where coalesce(target_type,'') <> (case when origin in ('new','return') then 'HCMC' else 'MC' end)) as 아직_어긋난_HC대상;


/* ── 되돌리기 (문제 생겼을 때만) ────────────────────────────────────────────
update public.semester_records r
set origin = b.origin, target_type = b.target_type
from public.semester_records_bak_hcfix b
where b.id = r.id;
   ------------------------------------------------------------------------- */
