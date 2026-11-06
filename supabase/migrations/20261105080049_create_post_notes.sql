-- Nook: 덧붙인 생각(post_notes) — 14단계 '과거의 생각'
-- Supabase에 적용된 마이그레이션 create_post_notes (버전 20261105080049)와 같은 내용.
-- 원래 글은 그대로 두고, 그 글 아래에 날짜별로 '지금의 생각'을 덧붙인다.

create table public.post_notes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade, -- 글을 지우면 메모도 함께
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now(),
  constraint post_notes_content_len check (char_length(content) between 1 and 10000)
);
create index post_notes_post_created_idx on public.post_notes (post_id, created_at);

alter table public.post_notes enable row level security;
create policy "본인 메모 조회" on public.post_notes for select to authenticated
  using ((select auth.uid()) = user_id);
-- 내 글에만 덧붙일 수 있다 (남의 글 id를 알아도 불가)
create policy "본인 글에 메모 작성" on public.post_notes for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.posts p where p.id = post_id and p.user_id = (select auth.uid()))
  );
create policy "본인 메모 삭제" on public.post_notes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 로그인 안 한 사람은 권한 없음, 쓰지 않는 권한(수정 등)은 회수
revoke all on table public.post_notes from anon;
revoke update, truncate, references, trigger on table public.post_notes from authenticated;
