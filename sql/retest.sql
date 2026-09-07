-- ============================================================================
--  미통과 관리 (서수원분원 전용) — 표 두 개
--
--  왜 이렇게 만들었나
--    조교가 큐앱에서 받은 엑셀을 하루 한 번 올린다. 9월 1일부터 누적된
--    전 반 파일 한 개다. 그 파일에는 '미통과'만 들어 있고 통과 여부 칸이 없다.
--    그래서 "어제 파일엔 있었는데 오늘 파일에 없으면 통과한 것"으로 본다.
--    → 올릴 때마다 그 분원·학기의 retest_items 를 통째로 갈아끼운다.
--
--    담임이 눌러 둔 조치는 retest_actions 에 따로 쌓는다.
--    학생 회원코드 + 시험열쇠(item_key)로 붙여 두기 때문에
--    성적을 다시 올려 목록이 갈려도 조치 기록은 지워지지 않는다.
--
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

-- 1) 지금 미통과인 시험 목록 (업로드할 때마다 통째로 교체)
create table if not exists public.retest_items (
  id           text primary key,
  branch_id    text not null,
  semester_id  text not null,
  student_code text not null,
  student_name text,
  class_label  text,
  teacher      text,
  gubun        text,            -- CHAT | 성과 | 활용 | 문법인증
  hoi          text,            -- 회차
  lesson       text,            -- 단원명
  textbook     text,            -- 교재명
  exam_date    text,            -- 시험일자 (파일에 적힌 그대로)
  jumsu        numeric,
  baejeom      numeric,
  eungsi       text,            -- 응시 | 재시험 | 미응시
  yeyak        text,            -- 예약일/시간 (비어 있으면 예약 없음)
  item_key     text not null,   -- 구분|회차|교재|단원 — 조치를 붙이는 열쇠
  created_at   timestamptz not null default now()
);

create index if not exists retest_items_scope
  on public.retest_items (branch_id, semester_id);
create index if not exists retest_items_student
  on public.retest_items (branch_id, semester_id, student_code);

-- 2) 담임이 누른 조치 (한 번 누를 때마다 한 줄씩 쌓인다 — 횟수를 세야 하므로)
create table if not exists public.retest_actions (
  id           text primary key,
  branch_id    text not null,
  semester_id  text not null,
  student_code text not null,
  item_key     text not null,
  kind         text not null,   -- yeyak | dokryeo | parent | bogang | print
  acted_on     text not null,   -- YYYY-MM-DD — 날짜별 미조치 알림에 쓴다
  memo         text,            -- 예약이면 다시 잡은 날짜·시간
  teacher      text,
  actor        text,            -- 누른 계정 아이디
  created_at   timestamptz not null default now()
);

create index if not exists retest_actions_scope
  on public.retest_actions (branch_id, semester_id);
create index if not exists retest_actions_item
  on public.retest_actions (branch_id, semester_id, student_code, item_key);

alter table public.retest_items   enable row level security;
alter table public.retest_actions enable row level security;

drop policy if exists retest_items_all on public.retest_items;
create policy retest_items_all on public.retest_items
  for all using (true) with check (true);

drop policy if exists retest_actions_all on public.retest_actions;
create policy retest_actions_all on public.retest_actions
  for all using (true) with check (true);

notify pgrst, 'reload schema';

-- 되돌리기:
--   drop table if exists public.retest_actions;
--   drop table if exists public.retest_items;
