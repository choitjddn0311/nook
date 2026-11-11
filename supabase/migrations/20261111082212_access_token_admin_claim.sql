-- 토큰에 관리자 여부도 넣는다 → proxy가 관리자를 관리 화면으로만 안내한다(DB에 묻지 않음)
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  p record;
begin
  select status, is_admin into p from public.profiles where id = (event->>'user_id')::uuid;
  return jsonb_set(
    jsonb_set(event, '{claims,account_status}', to_jsonb(coalesce(p.status, 'pending'))),
    '{claims,is_admin}', to_jsonb(coalesce(p.is_admin, false)));
end;
$$;

grant select (is_admin) on table public.profiles to supabase_auth_admin;
