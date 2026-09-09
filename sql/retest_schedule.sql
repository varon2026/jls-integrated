-- ============================================================================
--  재시험관리(Phase 2) — 재시험 일정·보강 완료 체크를 저장하는 새 표
--
--  왜 이렇게 만들었나
--    grader.html에 "재시험관리" 화면이 새로 생겼다. DT(체스)·AT(에이스) 컷라인
--    미달 학생을 분원 전체에서 한 화면에 모아, 재시험 일정을 잡고 보강 완료를
--    체크하는 대시보드다. 점수 자체는 기존 exam_scores에서 계산해 오지만,
--    "언제 재시험 보기로 했는지"·"보강 다녀왔는지"는 저장할 곳이 없어서 새로 만든다.
--
--    서수원분원 전용 "미통과 관리"(retest_items/retest_actions, CLAUDE.md 8-1절)와는
--    다른 기능이라 그 표를 재사용하지 않는다 — 여긴 전 분원 대상, DT·AT 전용이다.
--
--    학생당 시험종류(DT/AT)·학기 하나에 한 줄만 있으면 되므로
--    (semester, test_type, student_code) 를 유니크 키로 잡고 upsert로 쓴다.
--    담임 계정은 이미 saveDB류 접근이 막혀 있지 않고(grader.html은 애초에
--    publishable key로 클라이언트에서 직접 sb.from()을 부르는 구조라 서버단 권한 분리가
--    없다) 화면(JS)에서 TEACHER 파라미터로만 "보강 체크"를 가린다. 일정 잡기는
--    본사·분원·담임 모두 누를 수 있게 뒀다(시안 확정 사항).
--
--  Supabase → SQL Editor 에 붙여넣고 Run.
-- ============================================================================

create table if not exists public.retest_schedule (
  id uuid primary key default gen_random_uuid(),
  semester text not null,              -- 학기 id (예: sem_2026_fall) — semester_records.semester_id와 동일한 값
  test_type text not null check (test_type in ('DT','AT')),
  student_code text not null,          -- students.code
  branch text,                         -- 분원명 스냅샷(화면 표시·요약 집계용)
  teacher text,                        -- 담임명 스냅샷(화면 표시·요약 집계용)
  class_name text,                     -- 반 이름 스냅샷
  scheduled_at timestamptz,            -- 재시험 예정 일시. null이면 "일정 미정"
  makeup_done boolean not null default false,   -- 보강 완료 체크(담임만 화면에서 누름)
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (semester, test_type, student_code)
);

create index if not exists retest_schedule_sem_idx on public.retest_schedule (semester, test_type);

notify pgrst, 'reload schema';

-- 되돌리기:
--   drop table if exists public.retest_schedule;
