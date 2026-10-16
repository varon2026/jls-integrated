-- ============================================================================
--  ACE 이관생 — '진급'도 '진급 안함'처럼 명시적으로 저장하기
--
--  왜 필요한가
--    지금까지 ace_move_outcomes는 행이 있으면 무조건 '진급 안함'(보류)이었고,
--    행이 없으면 화면엔 그냥 기본값 '진급'(회색)이 떴다. 그런데 "아무도 안
--    건드려서 기본값인 것"과 "담임이 직접 '진급'으로 확인·선택한 것"이
--    구분이 안 된다는 지적으로, decision 칸을 둬서 둘 다 명시적으로 남긴다.
--
--    기존 행은 전부 '진급 안함'(보류)이었던 것들이라 default 'hold'로
--    채워도 데이터가 틀어지지 않는다.
--
--    '진급'으로 선택할 때는 사유를 안 받기로 해서(진급 안함만 사유 필수),
--    reason 칸을 nullable로 바꾼다.
--
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

alter table public.ace_move_outcomes
  add column if not exists decision text not null default 'hold';

alter table public.ace_move_outcomes
  alter column reason drop not null;

notify pgrst, 'reload schema';

-- 되돌리기:
--   alter table public.ace_move_outcomes drop column if exists decision;
--   update public.ace_move_outcomes set reason='(사유 없음)' where reason is null;
--   alter table public.ace_move_outcomes alter column reason set not null;
