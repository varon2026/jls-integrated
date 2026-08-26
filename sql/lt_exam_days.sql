-- ============================================================================
-- lt_exam_days — 레벨테스트 "날짜"의 성격을 저장한다.
--
-- 왜 필요한가:
--   관리자가 보고 싶은 건 '다음 학기 입학을 목표로 본 시험'의 결과다.
--   학기 중간에 보고 바로 등록한 일반 레벨테스트와 섞이면 의미가 없다.
--   학생마다 표시하면 손이 너무 가므로, 날짜 단위로 한 번만 표시하고
--   그날 예약된 학생을 통째로 그 전형으로 집계한다.
--
-- 분원은 캘린더에서 스위치 두 개만 켜면 된다:
--   is_admission  = 이 날은 다음 학기 전형인가          (끄면 평소 레벨테스트)
--   is_briefing   = 그날 설명회도 했는가                (전형일 때만 의미 있음)
--   개별전형은 별도 값이 아니라 is_admission=true & is_briefing=false 다.
--
-- 실행: Supabase → SQL Editor 에 붙여넣고 Run
-- ============================================================================

create table if not exists public.lt_exam_days (
  id              text primary key,
  branch_id       text not null,
  exam_date       date not null,
  is_admission    boolean not null default false,  -- 다음 학기 전형 여부
  target_semester text,                            -- 입학 대상 학기 (예: sem_2026_fall)
  is_briefing     boolean not null default false,  -- 그날 설명회 진행 여부
  briefing_no     integer,                         -- 설명회 회차 (1, 2, ...)
  attendees       integer,                         -- 설명회 참석 인원 (시험 안 본 사람 포함)
  updated_at      timestamptz default now(),
  unique (branch_id, exam_date)
);

-- 대상 학기로 훑는 조회가 잦다
create index if not exists lt_exam_days_sem_idx
  on public.lt_exam_days (target_semester)
  where is_admission;

alter table public.lt_exam_days enable row level security;

-- 앱이 publishable 키로 직접 붙으므로 다른 표와 같은 수준으로 열어둔다.
-- 조직 정책이 더 엄격하면 이 두 정책만 조정하면 된다.
drop policy if exists "lt_exam_days_read"  on public.lt_exam_days;
drop policy if exists "lt_exam_days_write" on public.lt_exam_days;
create policy "lt_exam_days_read"  on public.lt_exam_days for select using (true);
create policy "lt_exam_days_write" on public.lt_exam_days for all    using (true) with check (true);
