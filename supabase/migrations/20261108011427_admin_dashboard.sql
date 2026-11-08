-- Nook 관리자 대시보드: 계정별 글 개수(내용 없이)와 관리자의 계정 삭제
-- 관리자도 글 내용·제목은 볼 수 없다. 개수만 센다.

-- 1) 가입 목록에 글 개수를 더한다 (돌려주는 칸이 바뀌어 지우고 다시 만든다)
drop function public.admin_list_signups();

create function public.admin_list_signups()
returns table (
  id uuid,
  email text,
  provider text,
  status text,
  is_admin boolean,
  post_count bigint,
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
           u.created_at,
           p.approved_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by (p.status = 'pending') desc, u.created_at desc;
end;
$$;
revoke execute on function public.admin_list_signups() from public, anon;
grant execute on function public.admin_list_signups() to authenticated;

-- 2) 관리자가 계정을 지운다 (거절한 계정 정리 등)
--    자기 자신과 다른 관리자 계정은 지울 수 없다. 글·메모·프로필·복구 코드는 cascade로 함께 지워진다.
create function public.admin_delete_account(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin) then
    raise exception '관리자만 지울 수 있어요' using errcode = '42501';
  end if;
  if target = (select auth.uid()) then
    raise exception '내 계정은 여기서 지울 수 없어요' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles p where p.id = target and p.is_admin) then
    raise exception '관리자 계정은 지울 수 없어요' using errcode = '42501';
  end if;
  delete from auth.users where id = target;
end;
$$;
revoke execute on function public.admin_delete_account(uuid) from public, anon;
grant execute on function public.admin_delete_account(uuid) to authenticated;
