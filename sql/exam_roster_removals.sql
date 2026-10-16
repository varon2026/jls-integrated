-- ============================================================================
--  시험채점 명단 제외 표
--
--  왜 필요한가
--    퇴원은 아닌데(계속 재원) 휴원 중이거나, 사정상 그 반 시험만 안 보는 학생이
--    간간히 있다. 퇴원 처리를 하면 학적 전체에 영향을 주니까 그건 아니고,
--    딱 "이 시험 이 반 명단"에서만 빼고 싶다는 요청.
--    바로 지워버리면 왜 뺐는지 나중에 아무도 모르게 되니, 사유를 같이 받아 적어두고
--    명단에선 빠지되 그 반 화면 안에 "제외된 학생"으로 따로 보이게 한다(복구도 가능).
--
--  시험(test_type) · 학기별로 따로 저장 — DT에서 뺐다고 AT·내신모의고사까지
--  같이 빠지면 안 된다. 다음 학기엔 자동으로 안 넘어간다.
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

create table if not exists public.exam_roster_removals (
  id          text primary key,
  student_code text not null,
  test_type   text not null,          -- DT | AT | 내신모의고사
  semester_id text not null,
  reason      text not null,
  removed_by  text,
  removed_at  timestamptz not null default now()
);

create unique index if not exists exam_roster_removals_key
  on public.exam_roster_removals (student_code, test_type, semester_id);

alter table public.exam_roster_removals enable row level security;

drop policy if exists exam_roster_removals_all on public.exam_roster_removals;
create policy exam_roster_removals_all on public.exam_roster_removals
  for all using (true) with check (true);

notify pgrst, 'reload schema';

-- 되돌리기: drop table if exists public.exam_roster_removals;
