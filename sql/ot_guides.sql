-- ============================================================================
--  진급 OT 안내 — 화면에서 고친 내용을 저장하는 표
--  (통합관리 › 원무 › 진급 OT 안내 에서 엄윤경 계정이 [수정]→[저장]하면 여기에 저장된다.
--   저장된 게 없으면 ot-app/default-content.js 의 기본 내용(작년 PDF를 옮긴 것)을 보여준다.)
--  doc_key: 'common'(모든 반 공통) / 'hb_front' 'hb_back' 'pa1mwf_front' … (반별 앞·뒤 슬라이드)
--  새 표라 백업은 없다. 4단계: 1.조회 → 2.(백업 없음) → 3.생성 → 4.검증
-- ============================================================================

-- 1. 조회: 아직 없어야 정상 (null 이면 표가 없는 것)
select to_regclass('public.ot_guides');

-- 3. 생성
create table if not exists public.ot_guides (
  doc_key      text primary key,
  content_html text not null,
  updated_by   text,
  updated_at   timestamptz default now()
);
alter table public.ot_guides disable row level security;
grant all on public.ot_guides to anon, authenticated;

-- 4. 검증: 표 이름이 보이면 정상
select to_regclass('public.ot_guides');

-- 되돌리기(표 삭제 — 저장한 수정본이 모두 사라지고 기본 내용으로 돌아간다): drop table public.ot_guides;
