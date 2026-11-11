-- 토큰을 발급할 때 승인 상태를 claim으로 넣는다 → proxy가 DB에 묻지 않고 토큰만 보고 안내한다.
-- 잠금은 여전히 RLS(is_approved())가 한다. 이 값은 화면 안내용이다.
-- 적용 뒤 대시보드 Authentication → Hooks → Customize Access Token (JWT) Claims 에서 이 함수를 켠다.
create function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  user_status text;
begin
  select status into user_status from public.profiles where id = (event->>'user_id')::uuid;
  return jsonb_set(event, '{claims,account_status}', to_jsonb(coalesce(user_status, 'pending')));
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- 훅이 실행되는 역할은 status 칸만 읽을 수 있다
grant select (id, status) on table public.profiles to supabase_auth_admin;
create policy "토큰 발급 때 승인 상태 읽기" on public.profiles
  as permissive for select to supabase_auth_admin using (true);
