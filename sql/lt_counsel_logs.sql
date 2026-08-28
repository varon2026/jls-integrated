-- ============================================================================
-- 레벨테스트 상담 기록
--
-- 왜 필요한가:
--   2026-08-28 부터 iMS 임시회원 대리 등록이 막혔다. 그전에는 문의가 오면 iMS에
--   임시로 올려놓고 그 레코드에 상담을 적었는데, 이제 등록 확정 전에는 올릴 데가 없다.
--   레벨테스트만 보고 안 한 사람, 노쇼, 몇 년 뒤 다시 오는 사람의 상담이 통째로 사라진다.
--
-- 왜 응시자 표를 새로 안 만드는가:
--   level_test_reservations 에 이름·연락처·학교·학년·응시일·상태·결과가 이미 다 있다.
--   응시자 표를 새로 만들면 예약을 두 군데 넣어야 하고 전형 현황 숫자가 어긋난다.
--   그래서 상담만 따로 쌓고, 사람은 기존 예약에서 찾는다.
--
--   reservation_id : 어느 응시 건에 붙은 상담인지
--   phone_norm     : 숫자만 남긴 연락처. 예약이 지워져도 사람 단위로는 남는다.
--                    사람 묶기는 '연락처 + 이름' 이다 — 번호만으로 묶으면
--                    형제자매가 한 사람이 된다.
--
-- 실행: Supabase → SQL Editor 에 붙여넣고 Run
-- ============================================================================

create table if not exists public.lt_counsel_logs (
  id             text primary key,
  reservation_id text,
  branch_id      text not null,
  phone_norm     text,
  student_name   text,
  at             text not null,      -- 'YYYY-MM-DD HH:MM'
  kind           text not null,      -- 전화 / 문자 / 방문 / 기타
  staff          text,
  memo           text not null,
  created_at     timestamptz default now()
);

create index if not exists lt_counsel_res_idx   on public.lt_counsel_logs (reservation_id);
create index if not exists lt_counsel_phone_idx on public.lt_counsel_logs (branch_id, phone_norm);

alter table public.lt_counsel_logs enable row level security;

drop policy if exists lt_counsel_all on public.lt_counsel_logs;
create policy lt_counsel_all on public.lt_counsel_logs
  for all using (true) with check (true);

-- 재방문 감지·검색이 연락처로 도니까 조회를 빠르게
create index if not exists lt_res_phone_idx
  on public.level_test_reservations (branch_id, parent_phone);
