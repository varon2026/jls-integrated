-- ============================================================================
--  AT 성적표 링크 (학사관리 › AT 성적표) — 표 하나 + 함수 둘
--
--  왜 이렇게 만들었나
--    큐앱에는 정규반 학생만 AT 성적을 올릴 수 있어서, 내신반에 가 있는 학생은 성적표를
--    못 받았다(반을 정규반으로 옮겼다가 다시 내신반으로 옮겨야 했다). 그래서 분원이 성적 엑셀을 올리면
--    학생마다 성적표 화면(at-report.html)과 그 주소(링크)를 만들고, 링크를 문자로 보낸다.
--
--    · 성적표 주소는 추측할 수 없는 긴 글자(token)다. 주소를 아는 사람만 그 학생 성적표를 본다.
--    · 표에는 일부러 읽기 권한을 안 줬다(RLS 켜고 정책 없음). 웹 키만 있으면 누구나 전 학생을
--      훑어볼 수 없게, 읽기와 쓰기를 함수 두 개로만 한다.
--        at_cards_upsert  분원이 올릴 때: 같은 학생·같은 시험이면 주소는 그대로 두고 점수만 갈아 끼움
--        at_card_get      학생이 링크를 열 때: token 하나로 그 한 명 것만 돌려줌
--
--  Supabase → SQL Editor 에 붙여넣고 Run.
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

create or replace function public.at_cards_upsert(p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb; t text; out jsonb := '[]'::jsonb;
begin
  for r in select * from jsonb_array_elements(p_rows) loop
    insert into at_cards (token, branch_id, semester_id, student_code, student_name, exam_title, payload, created_by)
    values (replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
            r->>'branch_id', r->>'semester_id', r->>'student_code', r->>'student_name',
            r->>'exam_title', r->'payload', r->>'created_by')
    on conflict (branch_id, semester_id, student_code, exam_title)
    do update set student_name = excluded.student_name, payload = excluded.payload, created_at = now()
    returning token into t;
    out := out || jsonb_build_array(jsonb_build_object('student_code', r->>'student_code', 'token', t));
  end loop;
  return out;
end $$;

create or replace function public.at_card_get(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', student_name, 'exam_title', exam_title, 'payload', payload)
  from at_cards where token = p_token limit 1;
$$;

grant execute on function public.at_cards_upsert(jsonb) to anon, authenticated;
grant execute on function public.at_card_get(text)      to anon, authenticated;

notify pgrst, 'reload schema';

-- 되돌리기:
--   drop function if exists public.at_card_get(text);
--   drop function if exists public.at_cards_upsert(jsonb);
--   drop table if exists public.at_cards;
