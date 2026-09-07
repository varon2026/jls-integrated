-- ============================================================================
--  퇴원사유를 본사 확정 10개로 맞추기
--
--  왜 필요한가
--    조부장님이 퇴원사유를 아래 10개로 확정했다.
--      타학원 이동 / 담임 불만 / 스케줄(시간이동 불가)·폐강 / 교우 관계 /
--      이사·어학연수·캠프·여행(장기) / 졸업 / 차량 불만 / 학원비 부담 /
--      성적 불만족 / 건강상의 문제
--    '기타'가 없는 게 일부러 그런 것이다 — 반드시 이 10개 중에서 고르게 하려는 것.
--
--    그런데 이미 저장된 자료에는 없어진 분류가 들어 있다.
--      closed(폐강)  → 새 목록의 '스케줄 / 폐강'에 합쳐졌다. 아래 3번에서 바꾼다.
--      personal(개인 사유) · burden(학습 부담) · other(기타)
--                    → 새 목록에 갈 곳이 없다. 사람이 다시 골라야 한다.
--                       화면에는 '(옛 분류)'로 그대로 보이니 숫자가 사라지지는 않는다.
--
--  Supabase → SQL Editor 에 붙여넣고 한 단계씩 Run.
-- ============================================================================

-- 1. 조회 — 지금 어떤 사유가 몇 건인지
select withdraw_reason, count(*) as 건수
from public.semester_records
where status = 'withdraw'
group by withdraw_reason
order by 건수 desc;

-- 1-b. 사람이 다시 골라야 하는 학생 명단 (개인 사유 · 학습 부담 · 기타)
select r.semester_id, b.name as 분원, s.name as 이름, s.code as 회원코드,
       r.class_name as 반, r.withdraw_date as 퇴원일,
       r.withdraw_reason as 옛사유, r.withdraw_memo as 메모
from public.semester_records r
join public.students s on s.id = r.student_id
left join public.branches b on b.id = r.branch_id
where r.status = 'withdraw'
  and r.withdraw_reason in ('personal','burden','other')
order by r.semester_id desc, b.name, s.name;

-- 2. 백업 — 바꾸기 전 값을 통째로 남긴다
create table if not exists public.bak_wd_reason_20260907 as
select id, withdraw_reason, withdraw_memo
from public.semester_records
where status = 'withdraw';

-- 3. 수정 — 폐강은 '스케줄 / 폐강'으로 합친다 (뜻이 같으므로 자동으로 바꿔도 안전)
update public.semester_records
set withdraw_reason = 'schedule'
where status = 'withdraw' and withdraw_reason = 'closed';

-- 4. 검증 — 0이어야 한다
select count(*) as 남은_폐강
from public.semester_records
where status = 'withdraw' and withdraw_reason = 'closed';

-- 4-b. 바뀐 뒤 사유 분포 (확정 10개 + 사람이 다시 골라야 할 것)
select withdraw_reason, count(*) as 건수,
       case when withdraw_reason in
         ('academy','teacher','schedule','peer','moving','graduate','bus','fee','grade','health')
         then '확정 10개' else '사람이 다시 골라야 함' end as 구분
from public.semester_records
where status = 'withdraw'
group by withdraw_reason
order by 구분, 건수 desc;

-- ============================================================================
-- 되돌리기 (3번을 취소하고 싶을 때)
--   update public.semester_records r
--   set withdraw_reason = b.withdraw_reason
--   from public.bak_wd_reason_20260907 b
--   where b.id = r.id;
--
-- 백업 표 지우기 (다 확인한 뒤)
--   drop table if exists public.bak_wd_reason_20260907;
-- ============================================================================
