-- ============================================================================
-- 신입생 안내 페이지 (분원별 편집 가능, 학부모 공유용 공개 페이지)
-- 1.조회 → 2.백업 → 3.적용 → 4.검증 순서. 맨 아래 되돌리기 SQL 있음.
-- ============================================================================

-- 1. 조회 (처음 적용이라 없는 게 정상)
select * from information_schema.tables where table_name = 'branch_guides';

-- 2. 백업 (처음 적용이라 생략)

-- 3. 적용
create table if not exists branch_guides (
  branch_id    text primary key,       -- books-app BRANCHES 코드와 동일 (예: seosuwonjls)
  content_html text not null default '',
  hero_image_url text,                 -- 맨 위 배너에 분원이 직접 올린 그림 (없으면 기본 장식만 표시)
  updated_at   timestamptz not null default now(),
  updated_by   text
);
-- 이미 표가 있던 경우(첫 배포 이후 재실행)에도 새 칼럼이 추가되도록
alter table branch_guides add column if not exists hero_image_url text;

alter table branch_guides enable row level security;

-- 학부모가 로그인 없이 보는 공개 페이지라 익명 읽기를 허용한다.
drop policy if exists branch_guides_public_read on branch_guides;
create policy branch_guides_public_read on branch_guides
  for select using (true);

-- 쓰기는 분원 관리 화면(guide-app)에서 anon key로 들어오므로 일단 열어둔다.
-- (다른 분원 데이터도 anon key만 있으면 고칠 수 있다는 뜻 — 통합관리 로그인을 거쳐야만
--  guide-app에 도달하므로 당장은 괜찮지만, 나중에 Supabase Auth로 옮기면 branch_id 체크를
--  서버 쪽에서 강제하는 게 안전하다.)
drop policy if exists branch_guides_public_write on branch_guides;
create policy branch_guides_public_write on branch_guides
  for all using (true) with check (true);

-- 이미지 업로드용 스토리지 버킷 (Supabase 대시보드 → Storage 에서도 만들 수 있음)
insert into storage.buckets (id, name, public)
values ('guide-images', 'guide-images', true)
on conflict (id) do nothing;

drop policy if exists guide_images_public_read on storage.objects;
create policy guide_images_public_read on storage.objects
  for select using (bucket_id = 'guide-images');

drop policy if exists guide_images_public_write on storage.objects;
create policy guide_images_public_write on storage.objects
  for insert with check (bucket_id = 'guide-images');

-- 4. 검증 (0이 아니라 1이 나와야 정상 — 표가 생겼는지 확인)
select count(*) from information_schema.tables where table_name = 'branch_guides';

-- ============================================================================
-- 되돌리기 (문제 생기면 이 블록만 실행)
-- ============================================================================
-- drop table if exists branch_guides;
-- delete from storage.buckets where id = 'guide-images';
