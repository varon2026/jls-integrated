-- ============================================================================
--  DT 코멘트 — 분원별 문법교재 설정
--  (시험채점 › DT 답안입력 › [DT 코멘트] 에서 본사·분원 계정이 레벨별 문법교재를 고르면 여기에 저장된다.
--   담임 선생님이 복사하는 코멘트의 '문법수업 : ○○' 줄이 이 값으로 바뀐다. 표가 비어 있으면 기본표를 쓴다.)
--  새 표라 백업은 없다. 4단계: 1.조회 → 2.(백업 없음) → 3.생성 → 4.검증
-- ============================================================================

-- 1. 조회: 아직 없어야 정상 (null 이면 표가 없는 것)
select to_regclass('public.dt_comment_grammar');

-- 3. 생성
create table if not exists public.dt_comment_grammar (
  branch_id   text not null,
  level_code  text not null,          -- 코멘트의 '다음 레벨' (예: DSB1)
  book        text not null,          -- 선택한 문법교재
  updated_by  text,
  updated_at  timestamptz default now(),
  primary key (branch_id, level_code)
);
alter table public.dt_comment_grammar disable row level security;
grant all on public.dt_comment_grammar to anon, authenticated;

-- 4. 검증: 표 이름이 보이면 정상
select to_regclass('public.dt_comment_grammar');

-- 되돌리기(표 삭제): drop table public.dt_comment_grammar;
