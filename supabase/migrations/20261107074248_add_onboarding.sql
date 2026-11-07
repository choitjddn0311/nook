-- Nook 사용법 안내: 승인 후 처음 들어온 사람에게 한 번만 보여 준다.
-- 본 기록을 계정에 남겨서, 폰에서 본 뒤 PC에서 다시 나오지 않게 한다.

alter table public.profiles add column onboarded_at timestamptz;

-- 지금 있는 계정은 이미 쓰던 사람들이므로 본 것으로 채운다
update public.profiles set onboarded_at = now();

-- 프로필은 본인이 직접 고칠 수 없으므로, '봤어요' 기록만 남기는 함수를 둔다.
-- 승인 상태나 관리자 여부는 건드리지 않는다.
create function public.complete_onboarding()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
     set onboarded_at = coalesce(onboarded_at, now())
   where id = (select auth.uid());
$$;
revoke execute on function public.complete_onboarding() from public, anon;
grant execute on function public.complete_onboarding() to authenticated;
