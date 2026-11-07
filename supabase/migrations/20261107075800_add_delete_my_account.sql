-- Nook 20단계: 탈퇴
-- 로그인한 본인 계정만 지운다. 글, 덧붙인 생각, 프로필, 복구 코드는 cascade로 함께 지워진다.
-- 비밀 키 없이 동작하도록 security definer 함수로 둔다.

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception '로그인이 필요해요' using errcode = '42501';
  end if;
  -- 관리자 계정이 실수로 사라지면 가입 승인을 아무도 못 하므로 막는다
  if exists (select 1 from public.profiles p where p.id = me and p.is_admin) then
    raise exception '관리자 계정은 탈퇴할 수 없어요' using errcode = '42501';
  end if;
  delete from auth.users where id = me;
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
