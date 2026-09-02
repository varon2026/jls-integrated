-- ============================================================================
--  남동탄 26년가을 — 반 이름이 정리 안 된 채 갈라진 학생 4명 합치기
--
--  증상
--    교재관리 반 목록에 [DSB1]FA1/MWF/★ 같은 원본 이름이 뜨고, 그 반에 학생이
--    1명씩만 들어 있다. 정리된 같은 반(월수금 1부 · DSB1 등)은 따로 있다.
--
--  원인
--    보통은 학사관리가 반 이름을 정리해서 교재관리로 넘긴다.
--    이 4명은 정리 전 이름 그대로 넘어가 별개의 반이 돼버렸다.
--
--  ★ [1]번 조회로 4명이 누구인지 먼저 확인하고 [2]번을 돌리세요.
-- ============================================================================

-- ┌ [1] 누구인지 확인 ────────────────────────────────────────────────────────┐
select class_name as 지금_반, student_id as 회원코드, name as 이름, status as 상태
  from public.bk_students
 where branch='namdongtanjls' and semester='26년가을'
   and class_name like '[%'
 order by class_name, name;


-- ┌ [2] 합치기 — 교재관리 명단 ──────────────────────────────────────────────┐
-- update public.bk_students set class_name='월수금 1부 · DSB1', updated_at=now()
--  where branch='namdongtanjls' and semester='26년가을' and class_name='[DSB1]FA1/MWF/★';
--
-- update public.bk_students set class_name='월수금 1부 · DSC1', updated_at=now()
--  where branch='namdongtanjls' and semester='26년가을' and class_name='[DSC1]FA1/MWF/★';
--
-- update public.bk_students set class_name='화목 3부 · HM2', updated_at=now()
--  where branch='namdongtanjls' and semester='26년가을' and class_name='[HM2]FA3/TTH/★';
--
-- update public.bk_students set class_name='화목 2부 · LSC1', updated_at=now()
--  where branch='namdongtanjls' and semester='26년가을' and class_name='[LSC1]FA2/TTH/★';


-- ┌ [3] 학사관리 원본도 같이 — 안 고치면 다음 동기화 때 되돌아온다 ──────────┐
-- 교재관리로 넘어가는 값은 semester_records.class_label 이다.
-- 비었거나 원본 이름 그대로인 행만 정리된 이름으로 채운다.
-- update public.semester_records sr
--    set class_label = v.label
--   from (values
--     ('[DSB1]FA1/MWF/★','월수금 1부 · DSB1'),
--     ('[DSC1]FA1/MWF/★','월수금 1부 · DSC1'),
--     ('[HM2]FA3/TTH/★', '화목 3부 · HM2'),
--     ('[LSC1]FA2/TTH/★','화목 2부 · LSC1')
--   ) as v(cname, label)
--  where sr.class_name = v.cname
--    and sr.semester_id = 'sem_2026_fall'
--    and sr.branch_id in (select id from public.branches where name like '남동탄%')
--    and (sr.class_label is null or sr.class_label = '' or sr.class_label = sr.class_name);


-- ┌ [4] 확인 — [%로 시작하는 반이 0줄이어야 한다 ────────────────────────────┐
-- select class_name, count(*) from public.bk_students
--  where branch='namdongtanjls' and semester='26년가을' and class_name like '[%'
--  group by class_name;
