/* ============================================================================
   담임 칸에 두 명이 적혀 저장된 반 정리
   ----------------------------------------------------------------------------
   'David김동환, Diana권다은' 처럼 두 사람이 적히면 그 반이 별개의 담임 그룹이
   되어 대시보드·인원마감표·상담률이 둘로 쪼개진다.
   (대강으로 잠깐 들어간 선생님을 같이 적어 올린 경우)

   앞으로 올라오는 파일은 앱이 업로드 단계에서 막지만, 이미 저장된 건 이 SQL로 고친다.
   남기는 이름은 '맨 앞 이름'이다 — 3번을 돌리기 전에 1번 조회로
   맨 앞이 원래 담임이 맞는지 반드시 눈으로 확인할 것.

   ★ 1 → 2 → 3 → 4 순서로 한 덩어리씩 실행. 1번은 조회만 한다.
   ============================================================================ */


/* ── 1. 조회 — 두 명이 적힌 반과, 고치면 어떤 이름만 남는지 ───────────────── */

select b.name as 분원, r.semester_id as 학기, r.class_label as 반,
       r.teacher as 지금_담임,
       trim(regexp_replace(r.teacher, '\s*[,/&·・ㆍ|+;].*$', '')) as 남길_담임,
       count(*) as 학생수
from public.semester_records r
left join public.branches b on b.id = r.branch_id
where r.teacher ~ '[,/&·・ㆍ|+;]'
group by b.name, r.semester_id, r.class_label, r.teacher
order by b.name, r.semester_id, r.class_label;

-- ↑ '남길_담임'이 원래 담임이 아니면 여기서 멈추고, 3번 대신 아래 3-b 를 쓰세요.


/* ── 2. 백업 ─────────────────────────────────────────────────────────────── */

drop table if exists public.semester_records_bak_teacher;
create table public.semester_records_bak_teacher as
select id, branch_id, semester_id, class_name, class_label, teacher
from public.semester_records
where teacher ~ '[,/&·・ㆍ|+;]';

select count(*) as 백업된_행 from public.semester_records_bak_teacher;


/* ── 3. 수정 — 맨 앞 이름만 남긴다 ───────────────────────────────────────── */

update public.semester_records
set teacher = trim(regexp_replace(teacher, '\s*[,/&·・ㆍ|+;].*$', ''))
where teacher ~ '[,/&·・ㆍ|+;]';


/* ── 3-b. (대안) 남겨야 할 이름이 맨 앞이 아닐 때 — 반별로 직접 지정 ────────
update public.semester_records
set teacher = 'David김동환'
where teacher = 'David김동환, Diana권다은';
   ------------------------------------------------------------------------- */


/* ── 4. 검증 — 0 이어야 한다 ─────────────────────────────────────────────── */

select count(*) as 아직_두명인_반
from public.semester_records
where teacher ~ '[,/&·・ㆍ|+;]';


/* ── 되돌리기 (문제 생겼을 때만) ────────────────────────────────────────────
update public.semester_records r
set teacher = b.teacher
from public.semester_records_bak_teacher b
where b.id = r.id;
   ------------------------------------------------------------------------- */
