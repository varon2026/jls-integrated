-- ============================================================================
--  시상관리 — BEST SPEECH · BEST BOOK 투표
--
--  왜 이렇게 만들었나
--    한 사람이 최대 2표까지 던질 수 있어서, "후보당 한 표"가 아니라
--    (투표한 사람, 후보) 짝을 한 줄씩 쌓는 방식으로 만들었다. 후보별 득표수는
--    그냥 그 후보로 쌓인 줄 수를 세면 된다.
--
--    베스트 스피치는 분원관리자만, 베스트북은 분원관리자+담임 전체가 투표한다
--    (voter_username으로만 구분하고, 누가 투표권이 있는지는 화면에서 계산한다 —
--    직급이 바뀌어도 이 표를 손댈 필요가 없게).
--
--    동점이면 전부 인정한다(1등이 여러 명일 수 있다) — 화면에서 최고 득표수와
--    같은 사람을 전부 추리면 된다. 여기 표엔 순위 계산 로직이 없다.
--
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

create table if not exists public.award_votes (
  id              text primary key,
  branch_id       text not null,
  semester_id     text not null,
  category        text not null,   -- best_speech | best_book
  candidate_code  text not null,   -- 투표 대상 학생 회원코드
  voter_username  text not null,   -- 투표한 사람 로그인 아이디
  created_at      timestamptz not null default now()
);

create unique index if not exists award_votes_one_per_voter
  on public.award_votes (branch_id, semester_id, category, candidate_code, voter_username);

create index if not exists award_votes_scope
  on public.award_votes (branch_id, semester_id, category);

alter table public.award_votes enable row level security;

drop policy if exists award_votes_all on public.award_votes;
create policy award_votes_all on public.award_votes
  for all using (true) with check (true);

notify pgrst, 'reload schema';

-- 되돌리기:
--   drop table if exists public.award_votes;
