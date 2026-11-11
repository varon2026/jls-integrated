-- ============================================================================
--  DT 코멘트 — 분원별 코멘트 문구 수정본
--  (시험채점 › DT 답안입력 › [DT 코멘트] 에서 본사·분원 계정이 [수정]→[저장]하면 여기에 저장된다.
--   담임 선생님이 복사하는 코멘트가 이 분원 수정본으로 바뀐다. 표가 비어 있으면 기본 문구를 쓴다.
--   맨 윗줄(학기·레벨)은 자동이라 저장하지 않고, 그 아래 본문만 저장한다.)
--  새 표라 백업은 없다. 4단계: 1.조회 → 2.(백업 없음) → 3.생성 → 4.검증
-- ============================================================================

-- 1. 조회: 아직 없어야 정상 (null 이면 표가 없는 것)
select to_regclass('public.dt_comment_text');

-- 3. 생성
create table if not exists public.dt_comment_text (
  branch_id   text not null,
  text_key    text not null,          -- 'CHESS|DSB1' 또는 'ACE|PA1 반 (월수금)'
  body        text not null,          -- 맨 윗줄을 뺀 본문. 문법교재 자리는 {GRAMMAR}
  updated_by  text,
  updated_at  timestamptz default now(),
  primary key (branch_id, text_key)
);
alter table public.dt_comment_text disable row level security;
grant all on public.dt_comment_text to anon, authenticated;

-- 4. 검증: 표 이름이 보이면 정상
select to_regclass('public.dt_comment_text');

-- 되돌리기(표 삭제): drop table public.dt_comment_text;
