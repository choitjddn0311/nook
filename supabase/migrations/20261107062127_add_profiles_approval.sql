-- Nook 17단계: 가입 승인 제도
-- 누구나 가입 신청할 수 있지만, 관리자가 승인해야 글을 읽고 쓸 수 있다.
-- 관리자도 남의 글은 볼 수 없다 (관리자 함수는 계정 정보만 다룬다).

-- 1) 프로필: 계정마다 한 줄. 승인 상태와 관리자 여부
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade, -- 탈퇴하면 함께 삭제
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  approved_at timestamptz
);

-- 본인 프로필은 읽기만 (승인 상태를 스스로 바꿀 수 없다). 바꾸는 건 아래 관리자 함수만.
alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
create policy "본인 프로필 조회" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

-- 2) 가입하면 자동으로 '승인 대기' 프로필을 만든다 (이메일·Google·카카오 모두)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 지금 있는 계정은 관리자가 직접 만든 계정이므로 승인된 상태로 채운다
insert into public.profiles (id, status, approved_at)
select id, 'approved', now() from auth.users
on conflict (id) do nothing;

-- 3) 승인된 사용자인지 (RLS에서 쓰는 함수)
create function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'approved'
  );
$$;
revoke execute on function public.is_approved() from public, anon;
grant execute on function public.is_approved() to authenticated;

-- 4) 글·메모에 '승인된 사용자만' 조건을 더한다.
--    restrictive 정책은 기존 '본인 것만' 정책과 AND로 묶인다 → 본인 것 + 승인됨, 둘 다 맞아야 한다.
create policy "승인된 사용자만" on public.posts as restrictive for all to authenticated
  using ((select public.is_approved())) with check ((select public.is_approved()));
create policy "승인된 사용자만" on public.post_notes as restrictive for all to authenticated
  using ((select public.is_approved())) with check ((select public.is_approved()));

-- 5) 관리자 함수: 가입 목록 보기, 승인·거절
--    부르는 사람이 관리자가 아니면 거부한다. 글 내용에는 손대지 않는다.
create function public.admin_list_signups()
returns table (
  id uuid,
  email text,
  provider text,
  status text,
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
    select p.id, u.email::text, coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
           p.status, p.created_at, p.approved_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by (p.status = 'pending') desc, p.created_at desc;
end;
$$;

create function public.admin_set_status(target uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin) then
    raise exception '관리자만 바꿀 수 있어요' using errcode = '42501';
  end if;
  if new_status not in ('approved', 'rejected') then
    raise exception '알 수 없는 상태예요' using errcode = '22023';
  end if;
  if target = (select auth.uid()) then
    raise exception '내 계정의 상태는 바꿀 수 없어요' using errcode = '42501';
  end if;
  update public.profiles
     set status = new_status,
         approved_at = case when new_status = 'approved' then now() else null end
   where id = target;
end;
$$;

revoke execute on function public.admin_list_signups() from public, anon;
revoke execute on function public.admin_set_status(uuid, text) from public, anon;
grant execute on function public.admin_list_signups() to authenticated;
grant execute on function public.admin_set_status(uuid, text) to authenticated;
