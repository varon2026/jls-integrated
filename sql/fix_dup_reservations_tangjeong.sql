/* ============================================================================
   아산탕정분원(br_22jcktj) 레벨테스트 예약 — 엑셀 시간칸 때문에 이중 등록된 것 정리
   ----------------------------------------------------------------------------
   왜 중복으로 들어갔나
     일괄업로드(handleExcelFile, app.js)는 분원+학생(회원코드 또는 이름)+예약일+
     예약시간 네 가지가 모두 같아야 "중복"으로 보고 건너뛴다.
     처음 올릴 때 엑셀의 "11시"가 숫자 서식으로 읽혀 예약시간이 "0.4583..." 같은
     이상한 값으로 저장됐다. 운영자가 그 칸을 "11:00" 텍스트로 고쳐 다시 올리면서
     예약시간 값 자체가 달라져 중복으로 안 걸리고 같은 학생·같은 날짜가 새로
     하나 더 들어갔다.

   무엇을 바꾸나
     같은 분원·같은 학생·같은 예약일로 둘 이상 잡힌 건 중, 예약시간이 정상
     "H:MM"/"HH:MM" 형식이 아닌 — 즉 처음 잘못 올라간 — 쪽만 지운다.
     정상 시간으로 보이는 짝이 없으면(둘 다 이상하거나, 진짜 다른 이유로 두 번
     예약됐을 수도 있어서) 안전하게 건드리지 않고 1번 조회 결과에만 남겨서
     사람이 직접 보게 한다 — 지워서 예약이 통째로 없어지는 일을 막기 위함.

   ★ 1 → 2 → 3 → 4 순서로 한 덩어리씩 실행하세요. 1번은 조회만 합니다.
     1번 결과를 꼭 먼저 보고, "시간_정상형식 = false"로 뜬 쪽이 실제로
     지워도 되는 중복이 맞는지 확인한 뒤에 이어서 돌리세요.
   ============================================================================ */


/* ── 1. 조회 — 같은 분원·학생·예약일로 두 번 이상 잡힌 건 전부 ───────────── */

select r.id, r.student_code, r.student_name, r.reserved_date, r.reserved_time,
       (r.reserved_time ~ '^[0-9]{1,2}:[0-9]{2}$') as 시간_정상형식,
       r.created_at
from public.level_test_reservations r
where r.branch_id = 'br_22jcktj'
  and exists (
    select 1 from public.level_test_reservations r2
    where r2.branch_id = r.branch_id
      and coalesce(nullif(r2.student_code,''), r2.student_name) = coalesce(nullif(r.student_code,''), r.student_name)
      and r2.reserved_date = r.reserved_date
      and r2.id <> r.id
  )
order by coalesce(nullif(r.student_code,''), r.student_name), r.reserved_date, r.created_at;


/* ── 2. 백업 ─────────────────────────────────────────────────────────────── */

drop table if exists public.lt_res_bak_dup_time;
create table public.lt_res_bak_dup_time as
select r.*
from public.level_test_reservations r
where r.branch_id = 'br_22jcktj'
  and exists (
    select 1 from public.level_test_reservations r2
    where r2.branch_id = r.branch_id
      and coalesce(nullif(r2.student_code,''), r2.student_name) = coalesce(nullif(r.student_code,''), r.student_name)
      and r2.reserved_date = r.reserved_date
      and r2.id <> r.id
  );

select count(*) as 백업된_행 from public.lt_res_bak_dup_time;


/* ── 3. 삭제 — 이상한 시간 쪽만, 정상 시간 짝이 있을 때만 ──────────────────
   (정상 시간 짝이 없으면 안 지운다 — 예약이 통째로 사라지는 걸 막기 위함) */

delete from public.level_test_reservations r
where r.branch_id = 'br_22jcktj'
  and not (r.reserved_time ~ '^[0-9]{1,2}:[0-9]{2}$')
  and exists (
    select 1 from public.level_test_reservations r2
    where r2.branch_id = r.branch_id
      and coalesce(nullif(r2.student_code,''), r2.student_name) = coalesce(nullif(r.student_code,''), r.student_name)
      and r2.reserved_date = r.reserved_date
      and r2.id <> r.id
      and (r2.reserved_time ~ '^[0-9]{1,2}:[0-9]{2}$')
  );


/* ── 4. 검증 — 0이어야 한다 ───────────────────────────────────────────────── */

select count(*) as 아직_남은_이상한시간_중복
from public.level_test_reservations r
where r.branch_id = 'br_22jcktj'
  and not (r.reserved_time ~ '^[0-9]{1,2}:[0-9]{2}$')
  and exists (
    select 1 from public.level_test_reservations r2
    where r2.branch_id = r.branch_id
      and coalesce(nullif(r2.student_code,''), r2.student_name) = coalesce(nullif(r.student_code,''), r.student_name)
      and r2.reserved_date = r.reserved_date
      and r2.id <> r.id
      and (r2.reserved_time ~ '^[0-9]{1,2}:[0-9]{2}$')
  );


/* ── 되돌리기 (문제 생겼을 때만) ────────────────────────────────────────────
insert into public.level_test_reservations
select * from public.lt_res_bak_dup_time b
where not exists (select 1 from public.level_test_reservations r where r.id=b.id);
   ------------------------------------------------------------------------- */


/* ── 뒷정리 (다 끝난 뒤에) ──────────────────────────────────────────────────
drop table if exists public.lt_res_bak_dup_time;
   ------------------------------------------------------------------------- */
