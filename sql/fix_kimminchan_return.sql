-- ============================================================================
--  수원분원 김민찬 — 복귀생인데 "기존생(start)"으로 잘못 표시된 것 정리
--
--  왜 이렇게 됐나
--    가을학기 시작인원 재계산이 여름학기 마감(336)보다 1명 많은 337로 나옴.
--    원인 추적: 김민찬(U002980006, 잠원초등학교 초등6)이 8/31(여름학기
--    마지막날)에 "누나(김하나) 옮기는 학원으로 이동"한다며 퇴원 처리됐다가,
--    가을학기에 다시 등록했다. 명백한 '복귀생'인데 origin이 'start'
--    (원래부터 계속 다니던 사람)로 잘못 찍혀서, "학기초" 계산이 이 학생을
--    신규/복귀 쪽으로 안 빼고 "원래 있던 사람"으로 세버렸다.
--
--    inwon-app/app.js 확인: 신규 인원 집계는 origin이 'new'든 'return'이든
--    똑같이 센다(newRecs = origin==='new'||origin==='return'). 즉 origin만
--    'return'으로 바로잡으면 계산이 자동으로 336에 정확히 맞아떨어진다.
--    target_type도 함께 바꿔야 함(originTargetType(): return→HCMC) — 복귀생은
--    해피콜(HC) 대상이기도 해서, 지금처럼 MC로 남아있으면 해피콜 대상에서 빠진다.
--
--  1. 조회
-- ============================================================================
select id, student_id, semester_id, origin, target_type, status, withdraw_date
from public.semester_records
where student_id='st_8eimzog'
order by semester_id;

-- 2. 백업
create table if not exists public._backup_kimminchan_return as
select * from public.semester_records where student_id='st_8eimzog' and semester_id='sem_2026_fall';

-- 3. 수정
update public.semester_records
set origin='return', target_type='HCMC'
where student_id='st_8eimzog' and semester_id='sem_2026_fall' and origin='start';

-- 4. 검증
select student_id, semester_id, origin, target_type from public.semester_records
where student_id='st_8eimzog' and semester_id='sem_2026_fall';

-- 되돌리기:
--   update public.semester_records r set origin=b.origin, target_type=b.target_type
--     from public._backup_kimminchan_return b where r.id=b.id;
