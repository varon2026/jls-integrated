-- ============================================================================
--  AT 성적표 링크 — 표 하나 + 함수 하나 (한 번만 실행)
--
--  왜 이렇게 만들었나
--    큐앱에는 정규반 학생만 AT 성적을 올릴 수 있어서, 내신반에 가 있는 학생은 성적표를 못 받았다.
--    그래서 성적 엑셀 한 장으로 학생마다 성적표 화면(루트의 at-report.html)과 그 주소(링크)를 만들고,
--    링크를 학원 홈페이지 문자 기능으로 보낸다. 홈페이지에 새 메뉴는 만들지 않는다(운영자 요청).
--
--    · 성적은 tools/at_report_make.py 가 엑셀을 읽어 만든 INSERT 문(at_cards_insert_….sql)을
--      Supabase SQL Editor 에서 실행해서 넣는다.
--    · 주소는 추측할 수 없는 긴 글자(token)다. 주소를 아는 사람만 그 학생 성적표를 본다.
--    · 표에는 일부러 읽기·쓰기 권한을 안 줬다(RLS 켜고 정책 없음). 웹 키만 있으면 누구나
--      전 학생을 훑어보거나 덮어쓸 수 없게, 읽기는 at_card_get 함수(token 하나 → 그 한 명)로만 한다.
-- ============================================================================

create table if not exists public.at_cards (
  token        text primary key,
  branch_id    text not null,
  semester_id  text not null,
  student_code text not null,
  student_name text,
  exam_title   text not null,          -- 예: 2026 겨울학기 AT시험 A2(1-3개월)
  payload      jsonb not null,         -- 점수 전체 (총점·영역·세부 항목)
  created_by   text,
  created_at   timestamptz not null default now(),
  unique (branch_id, semester_id, student_code, exam_title)
);

alter table public.at_cards enable row level security;   -- 정책을 안 만든다 = 표를 직접 읽거나 쓸 수 없음

create or replace function public.at_card_get(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', student_name, 'exam_title', exam_title, 'payload', payload)
  from at_cards where token = p_token limit 1;
$$;

grant execute on function public.at_card_get(text) to anon, authenticated;

-- 예전 버전에서 만든 '올리기' 함수가 있으면 지운다(누구나 호출해 성적을 덮어쓸 수 있었음)
drop function if exists public.at_cards_upsert(jsonb);

notify pgrst, 'reload schema';

-- 되돌리기:
--   drop function if exists public.at_card_get(text);
--   drop table if exists public.at_cards;
