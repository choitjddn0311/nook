-- Nook: 글(posts) 테이블
-- Supabase에 적용된 마이그레이션 create_posts (버전 20261105055525)와 같은 내용.

-- 글 테이블
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text,
  content     text not null default '',
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint posts_tags_max check (cardinality(tags) <= 10)
);

-- 인덱스: 목록(최신순), 태그 필터
create index posts_user_created_idx on public.posts (user_id, created_at desc);
create index posts_tags_idx on public.posts using gin (tags);

-- 수정 시각 자동 갱신
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

-- RLS: 본인 글만 읽고 쓸 수 있다. anon(로그인 안 함)용 정책은 없으므로 아무것도 볼 수 없다.
alter table public.posts enable row level security;
create policy "본인 글 조회" on public.posts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "본인 글 작성" on public.posts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "본인 글 수정" on public.posts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "본인 글 삭제" on public.posts for delete to authenticated
  using ((select auth.uid()) = user_id);
