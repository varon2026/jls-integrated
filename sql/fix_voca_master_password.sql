-- ============================================================================
-- 신입생 안내 페이지 - 초등 VOCA Master 비밀번호 jls202606 → 1004
-- 1.조회 → 2.백업 → 3.수정 → 4.검증(1이어야 함) 순서. 맨 아래 되돌리기 SQL 있음.
-- ============================================================================

-- 1. 조회 — 어느 분원 안내 페이지에 이 비밀번호가 들어있는지 확인
select branch_id, updated_at
from branch_guides
where content_html like '%jls202606%';

-- 2. 백업 — 혹시 잘못됐을 때 되돌릴 수 있게 원본 저장
create table if not exists _backup_branch_guides_20261031 as
select * from branch_guides where content_html like '%jls202606%';

-- 3. 수정 — 텍스트만 그대로 바꿔치기(다른 내용은 안 건드림)
update branch_guides
set content_html = replace(content_html, 'jls202606', '1004'),
    updated_at = now()
where content_html like '%jls202606%';

-- 4. 검증 — 1(또는 그 이상, 여러 분원에 있었으면)이 나와야 정상, 0이면 안 바뀐 것
select count(*) from branch_guides where content_html like '%1004%' and content_html like '%VOCA Master%';

-- ============================================================================
-- 되돌리기 (문제 생기면 이 블록만 실행)
-- ============================================================================
-- update branch_guides bg
-- set content_html = b.content_html, updated_at = b.updated_at
-- from _backup_branch_guides_20261031 b
-- where bg.branch_id = b.branch_id;
