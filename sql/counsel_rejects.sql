-- ============================================================================
-- 상담 인정 제외 (△)
--
-- IMS에서 받은 상담이력은 대괄호 태그만 있으면 무조건 '완료(○)'로 잡힌다.
-- 그런데 막상 열어보면 [MC3]부재중 이거나, 기본 양식만 붙여넣은 것도 많다.
-- 사람이 보고 "이건 상담으로 못 친다"고 표시할 수 있게 하는 표다.
--
--   content_key : 표시할 당시 상담 내용의 지문(fingerprint).
--                 다음 업로드에서 그 단계 내용이 바뀌면 지문이 달라져
--                 표시가 저절로 풀린다 → 다시 ○ 로 돌아온다.
--                 같은 파일을 다시 올려 내용이 그대로면 △ 가 유지된다.
--
-- 실행: Supabase → SQL Editor 에 붙여넣고 Run
-- ============================================================================

create table if not exists public.counsel_rejects (
  id           text primary key,
  student_id   text not null,
  branch_id    text not null,
  semester_id  text not null,
  stage        text not null,
  content_key  text not null,
  created_at   text
);

create index if not exists counsel_rejects_lookup_idx
  on public.counsel_rejects (branch_id, semester_id, student_id, stage);

alter table public.counsel_rejects enable row level security;

drop policy if exists counsel_rejects_all on public.counsel_rejects;
create policy counsel_rejects_all on public.counsel_rejects
  for all using (true) with check (true);
