-- ============================================================================
--  내신모의고사 학년 보정 표
--
--  왜 필요한가
--    내신모의고사는 "반 이름에 박힌 학년(E6/M1)"으로 학생을 초6/중1 시험으로
--    나눈다. 근데 사정상 자기 학년 아닌 반에 들어가 있는 학생이 전분원에서
--    간간히 있다 — 초6인데 중1반 소속, 혹은 중1인데 초6반 소속.
--    그 학기에 그 학년 전체가 시험을 안 봐서 정답키를 안 올리면, 반 이름만
--    보고 분류된 그 학생은 명단 자체가 안 떠서 채점할 방법이 없었다
--    (서수원분원 가유준·박지아·고효민 — 초6인데 중1반이라 이번 학기 중1
--    정답키가 없어서 통째로 안 보임).
--    반대로 수업은 듣지만 내신모의고사 자체를 안 보는 학생(황지연 — 중1인데
--    초6반 소속, 초6 시험 대상 아님)도 반 이름만 보면 자동으로 끼어버린다.
--    추정을 버리고, 사람이 학생 단위로 한 번 지정해주는 방식으로 뗀다
--    (exam_class_stages와 같은 방식).
--
--  override 값: 'E6' | 'M1' | 'EXCLUDE'(내신모의고사 대상 아님)
--  학기마다 따로 저장 — 다음 학기에 반이 바뀌면 자동으로 안 넘어간다.
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

create table if not exists public.naesin_overrides (
  id          text primary key,
  student_code text not null,
  semester_id text not null,
  override    text not null,          -- E6 | M1 | EXCLUDE
  updated_at  timestamptz not null default now()
);

create unique index if not exists naesin_overrides_key
  on public.naesin_overrides (student_code, semester_id);

alter table public.naesin_overrides enable row level security;

drop policy if exists naesin_overrides_all on public.naesin_overrides;
create policy naesin_overrides_all on public.naesin_overrides
  for all using (true) with check (true);

notify pgrst, 'reload schema';

-- 되돌리기: drop table if exists public.naesin_overrides;
