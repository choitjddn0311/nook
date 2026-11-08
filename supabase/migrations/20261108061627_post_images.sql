-- 글에 사진 붙이기
-- 파일: Storage 비공개 버킷 post-images, 경로 <user_id>/<post_id>/<image_id>.webp|jpg
-- 정보: post_images 표 (어느 글의 몇 번째 사진인지, 크기, 설명)
-- 제한: 글당 10장, 계정당 200장, 파일 하나 2MB (기기에서 줄여서 올린다)

-- 1) 버킷: 비공개, 2MB, WebP·JPEG만
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', false, 2097152, array['image/webp', 'image/jpeg']);

-- 2) Storage 정책: 첫 폴더가 내 id이고 승인된 사용자일 때만 올리기·보기·지우기
--    관리자용 정책은 없다 → 관리자도 남의 사진을 볼 수 없다
create policy "본인 사진 올리기" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_approved())
  );
create policy "본인 사진 보기" on storage.objects for select to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_approved())
  );
create policy "본인 사진 지우기" on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_approved())
  );

-- 3) 사진 정보 표
create table public.post_images (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,   -- 글을 지우면 함께
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  path       text not null unique,                                           -- Storage 안의 경로
  width      integer not null check (width between 1 and 4096),
  height     integer not null check (height between 1 and 4096),
  alt        text check (char_length(alt) <= 200),                          -- 사진 설명 (선택)
  position   smallint not null default 0,
  created_at timestamptz not null default now()
);
create index post_images_post_idx on public.post_images (post_id, position);
create index post_images_user_idx on public.post_images (user_id);

alter table public.post_images enable row level security;

create policy "본인 사진 정보 읽기" on public.post_images
  for select to authenticated using (user_id = (select auth.uid()));
create policy "본인 사진 정보 고치기" on public.post_images
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "본인 사진 정보 지우기" on public.post_images
  for delete to authenticated using (user_id = (select auth.uid()));
create policy "승인된 사용자만" on public.post_images
  as restrictive for all to authenticated using (public.is_approved()) with check (public.is_approved());

-- 넣기는 아래 함수로만, 고치기는 설명과 순서만
revoke all on public.post_images from anon;
revoke insert, update, truncate, references, trigger on public.post_images from authenticated;
grant update (alt, position) on public.post_images to authenticated;

-- 4) 사진 붙이기: 파일을 올린 뒤 부른다. 내 글인지, 경로가 맞는지, 파일이 정말 있는지, 장수 제한을 확인한다
create or replace function public.add_post_image(p_post_id uuid, p_path text, p_width integer, p_height integer)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  new_id uuid;
begin
  if me is null or not public.is_approved() then
    raise exception '사진을 붙일 수 없는 계정이에요' using errcode = '42501';
  end if;
  if not exists (select 1 from public.posts p where p.id = p_post_id and p.user_id = me) then
    raise exception '내 글에만 사진을 붙일 수 있어요' using errcode = '42501';
  end if;
  if p_path !~ ('^' || me::text || '/' || p_post_id::text || '/[0-9a-f-]{36}\.(webp|jpg)$') then
    raise exception '사진 경로가 맞지 않아요' using errcode = '22023';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'post-images' and o.name = p_path) then
    raise exception '올린 파일을 찾지 못했어요' using errcode = '22023';
  end if;

  -- 같은 사람이 동시에 올려도 장수 제한을 넘지 않게 한 사람씩 처리
  perform pg_advisory_xact_lock(hashtext('post_images:' || me::text));
  if (select count(*) from public.post_images i where i.post_id = p_post_id) >= 10 then
    raise exception '글 하나에 사진은 10장까지 붙일 수 있어요' using errcode = 'P0413';
  end if;
  if (select count(*) from public.post_images i where i.user_id = me) >= 200 then
    raise exception '사진은 계정마다 200장까지 올릴 수 있어요' using errcode = 'P0413';
  end if;

  insert into public.post_images (post_id, user_id, path, width, height, position)
  values (
    p_post_id, me, p_path, p_width, p_height,
    coalesce((select max(i.position) + 1 from public.post_images i where i.post_id = p_post_id), 0)
  )
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.add_post_image(uuid, text, integer, integer) from public, anon;
grant execute on function public.add_post_image(uuid, text, integer, integer) to authenticated;

-- 5) 주인 없는 파일 찾기 (정리 함수 전용, service_role만)
--    탈퇴·관리자 삭제·업로드 중단으로 정보 행 없이 남은 파일. 올리는 중일 수 있어 1시간 지난 것만
create or replace function public.orphan_image_paths()
returns setof text
language sql
security definer
set search_path = ''
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'post-images'
    and o.created_at < now() - interval '1 hour'
    and not exists (select 1 from public.post_images i where i.path = o.name)
  limit 1000;
$$;
revoke all on function public.orphan_image_paths() from public, anon, authenticated;
grant execute on function public.orphan_image_paths() to service_role;

-- 6) 관리자 목록에 계정별 사진 수 (개수만, 사진은 볼 수 없음). 반환 칸이 바뀌어 지우고 다시 만든다
drop function public.admin_list_signups();
create function public.admin_list_signups()
returns table (
  id uuid,
  email text,
  provider text,
  status text,
  is_admin boolean,
  post_count bigint,
  image_count bigint,
  created_at timestamptz,
  approved_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin) then
    raise exception '관리자만 볼 수 있어요' using errcode = '42501';
  end if;
  return query
    select p.id,
           u.email::text,
           coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
           p.status,
           p.is_admin,
           (select count(*) from public.posts x where x.user_id = p.id),
           (select count(*) from public.post_images x where x.user_id = p.id),
           u.created_at,
           p.approved_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by (p.status = 'pending') desc, u.created_at desc;
end;
$$;
revoke execute on function public.admin_list_signups() from public, anon;
grant execute on function public.admin_list_signups() to authenticated;

-- 7) 매일 한국 시간 4시 30분에 정리 함수 호출
select cron.schedule(
  'cleanup-orphan-images',
  '30 19 * * *',
  $$
  select net.http_post(
    url := 'https://xiblmttontfescoxpros.supabase.co/functions/v1/cleanup-orphan-images',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
