/* ============================================================================
   레벨테스트 예약(level_test_reservations) — 학년 표기를 전부 "초등2"/"중등1" 긴
   형식으로 통일. 짧은 "초2"/"중1" 그대로 저장된 것들을 고친다.
   ----------------------------------------------------------------------------
   왜 고쳐야 하나
     목록 배지는 gradeTxt()로 보여줄 때만 "초등2"로 바꿔서 보여줬을 뿐, 실제
     저장값은 엑셀/입력한 그대로("초2")였다. 레벨테스트 채점 화면(leveltest)의
     학년 선택지는 "초등2"/"중등1" 같은 긴 글자만 있어서, 예약에서 "채점하기"를
     누를 때 짧은 "초2"가 그대로 넘어가면 학년이 안 골라졌다
     (아산탕정 신지안 학생 — 엑셀에 "초2"로 올라가서 학년정보가 안 따라붙던 건).
     app.js 쪽(일괄업로드·수동등록·수정)은 저장할 때 바로 긴 형식으로 바꾸도록
     코드를 고쳤다(2026-10-28). 이 SQL은 그 전에 이미 짧은 형식으로 저장된
     과거 예약을 한 번에 맞춘다.

   무엇을 바꾸나
     "초2"→"초등2", "중1"→"중등1", "고3"→"고등3" 처럼 접두어+숫자만 있으면
     긴 형식으로 바꾼다. 이미 "초등2"처럼 긴 형식인 건 바뀔 값이 같아서
     그대로 둔다(안전). "초등학교 2학년"처럼 패턴에 안 맞는 자유 서술은
     안 건드리고 그대로 둔다.

   ★ 1 → 2 → 3 → 4 순서로 한 덩어리씩 실행하세요. 1번은 조회만 합니다.
     1번 결과에 이상한 값(패턴 오인식)이 있으면 3번을 돌리지 말고 알려주세요.
   ============================================================================ */


/* ── 1. 조회 — 실제로 값이 바뀔 행만, 현재값·바뀔값·건수로 미리 보기 ───────── */

with mapped as (
  select grade,
    case
      when grade ~ '^초\s*등?\s*[0-9]' then '초등' || substring(grade from '[0-9]')
      when grade ~ '^중\s*등?\s*[0-9]' then '중등' || substring(grade from '[0-9]')
      when grade ~ '^고\s*등?\s*[0-9]' then '고등' || substring(grade from '[0-9]')
      when grade ~ '^[0-9]+$'          then grade || '학년'
      else grade
    end as 바뀔값
  from public.level_test_reservations
  where grade is not null and grade <> ''
)
select grade as 현재값, 바뀔값, count(*) as 건수
from mapped
where grade is distinct from 바뀔값
group by grade, 바뀔값
order by 건수 desc;


/* ── 2. 백업 ─────────────────────────────────────────────────────────────── */

drop table if exists public.lt_res_bak_grade;
create table public.lt_res_bak_grade as
select id, grade
from public.level_test_reservations
where grade is not null and grade <> '';

select count(*) as 백업된_행 from public.lt_res_bak_grade;


/* ── 3. 수정 ─────────────────────────────────────────────────────────────── */

update public.level_test_reservations
set grade = case
    when grade ~ '^초\s*등?\s*[0-9]' then '초등' || substring(grade from '[0-9]')
    when grade ~ '^중\s*등?\s*[0-9]' then '중등' || substring(grade from '[0-9]')
    when grade ~ '^고\s*등?\s*[0-9]' then '고등' || substring(grade from '[0-9]')
    when grade ~ '^[0-9]+$'          then grade || '학년'
    else grade
  end
where grade is not null and grade <> '';


/* ── 4. 검증 — 짧은 형식("초2" 등)이 하나도 안 남아야 한다, 0이어야 함 ───────── */

select count(*) as 아직_짧은형식
from public.level_test_reservations
where grade ~ '^초[0-9]' or grade ~ '^중[0-9]' or grade ~ '^고[0-9]' or grade ~ '^[0-9]+$';


/* ── 되돌리기 (문제 생겼을 때만) ────────────────────────────────────────────
update public.level_test_reservations r
set grade = b.grade
from public.lt_res_bak_grade b
where b.id = r.id;
   ------------------------------------------------------------------------- */


/* ── 뒷정리 (다 끝난 뒤에) ──────────────────────────────────────────────────
drop table if exists public.lt_res_bak_grade;
   ------------------------------------------------------------------------- */
