-- ============================================================================
-- 신입생 안내 분원 코드를 통합관리 분원 코드로 통일
--   seosuwonjls  →  br_seosuwon  (서수원)
-- 1.조회 → 2.백업 → 3.복사 → 4.검증 → 5.옛 행 삭제(검증 후에만)
-- 맨 아래 되돌리기 SQL 있음.
-- ============================================================================

-- 1. 조회 (지금 있는 행)
select branch_id, length(content_html), updated_at from branch_guides where branch_id in ('seosuwonjls','br_seosuwon');

-- 2. 백업 (이 결과를 복사해 두세요 — 문제 생기면 되돌리기 SQL에 붙여넣으세요)
select branch_id, content_html, hero_image_url from branch_guides where branch_id = 'seosuwonjls';

-- 3. 복사 (옛 행을 새 코드로 한 벌 더 만든다. 옛 행은 그대로 남긴다)
insert into branch_guides (branch_id, content_html, hero_image_url, updated_at, updated_by)
select 'br_seosuwon', content_html, hero_image_url, now(), 'claude-session'
from branch_guides where branch_id = 'seosuwonjls'
on conflict (branch_id) do update
  set content_html = excluded.content_html,
      hero_image_url = excluded.hero_image_url,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by;

-- 4. 검증 (두 길이가 같아야 함)
select branch_id, length(content_html) from branch_guides where branch_id in ('seosuwonjls','br_seosuwon');

-- 5. 옛 행 삭제 — 4번 결과가 같고, 새 주소에서 화면이 맞게 보인 뒤에만 실행
-- delete from branch_guides where branch_id = 'seosuwonjls';

-- ============================================================================
-- 되돌리기 (새 행을 지우면 옛 행은 그대로 있으므로 그것만 지우면 원래대로)
-- delete from branch_guides where branch_id = 'br_seosuwon';
