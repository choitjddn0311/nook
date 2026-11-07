-- Nook 18단계: 복구 코드
-- 메일을 보내지 않으므로, 가입 때 받은 복구 코드로 비밀번호를 직접 다시 정한다.
-- 관리자가 끼지 않는다 ('관리자도 남의 글을 볼 수 없다' 원칙을 지키기 위해).

-- 1) 복구 코드 표: 원문은 저장하지 않고 해시만 둔다.
--    정책과 권한을 주지 않으므로 앱·API에서 직접 읽을 수 없고, 아래 함수로만 다룬다.
create table public.account_recovery (
  user_id         uuid primary key references auth.users(id) on delete cascade, -- 탈퇴하면 함께 삭제
  code_hash       text not null,
  failed_attempts integer not null default 0,
  locked_until    timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.account_recovery enable row level security;
revoke all on table public.account_recovery from anon, authenticated;

-- 2) 내부용: 코드를 만들어 해시를 저장하고 원문을 돌려준다. 앱에서 직접 부를 수 없다.
--    코드는 무작위 80비트(XXXXX-XXXXX-XXXXX-XXXXX). 충분히 길어서 빠른 해시(sha256)로 충분하다.
create function public.issue_recovery_code(target uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw text := upper(encode(extensions.gen_random_bytes(10), 'hex'));
begin
  insert into public.account_recovery (user_id, code_hash)
  values (target, encode(extensions.digest(raw, 'sha256'), 'hex'))
  on conflict (user_id) do update
    set code_hash = excluded.code_hash,
        failed_attempts = 0,
        locked_until = null,
        created_at = now();
  return substr(raw, 1, 5) || '-' || substr(raw, 6, 5) || '-' || substr(raw, 11, 5) || '-' || substr(raw, 16, 5);
end;
$$;
revoke execute on function public.issue_recovery_code(uuid) from public, anon, authenticated;

-- 3) 로그인한 본인의 복구 코드 만들기 (다시 만들면 이전 코드는 무효)
--    비밀번호가 없는 소셜 로그인 계정에는 필요 없으므로 거부한다.
create function public.create_recovery_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null or not exists (
    select 1 from auth.users u where u.id = me and u.encrypted_password is not null and u.encrypted_password <> ''
  ) then
    raise exception '복구 코드를 만들 수 없는 계정이에요' using errcode = '42501';
  end if;
  return public.issue_recovery_code(me);
end;
$$;
revoke execute on function public.create_recovery_code() from public, anon;
grant execute on function public.create_recovery_code() to authenticated;

-- 4) 복구 코드로 비밀번호 다시 정하기 (로그인 전에 부른다)
--    성공: 새 복구 코드를 돌려준다. 실패: null (없는 계정·틀린 코드·잠김을 구분하지 않는다).
--    5번 틀리면 1시간 잠근다. 성공하면 이 계정의 모든 로그인 세션을 끊는다.
create function public.reset_password_with_code(identifier text, code text, new_password text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  login text := lower(trim(identifier));
  target uuid;
  rec public.account_recovery%rowtype;
begin
  -- 비밀번호 길이 (bcrypt는 72바이트까지만 쓴다)
  if char_length(new_password) < 8 or octet_length(new_password) > 72 then
    raise exception '비밀번호는 8자 이상이어야 해요' using errcode = '22023';
  end if;

  -- 아이디는 내부 이메일로 저장되어 있다 (src/lib/username.ts와 같은 도메인)
  if position('@' in login) = 0 then
    login := login || '@users.nook.invalid';
  end if;

  select u.id into target from auth.users u where lower(u.email) = login;
  if target is null then
    return null;
  end if;

  select * into rec from public.account_recovery r where r.user_id = target for update;
  if not found or (rec.locked_until is not null and rec.locked_until > now()) then
    return null;
  end if;

  if rec.code_hash <> encode(
    extensions.digest(upper(regexp_replace(code, '[^0-9a-zA-Z]', '', 'g')), 'sha256'), 'hex'
  ) then
    update public.account_recovery
       set failed_attempts = case when rec.failed_attempts + 1 >= 5 then 0 else rec.failed_attempts + 1 end,
           locked_until = case when rec.failed_attempts + 1 >= 5 then now() + interval '1 hour' else null end
     where user_id = target;
    return null;
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf', 10)),
         updated_at = now()
   where id = target;
  delete from auth.sessions where user_id = target;

  return public.issue_recovery_code(target);
end;
$$;
revoke execute on function public.reset_password_with_code(text, text, text) from public;
grant execute on function public.reset_password_with_code(text, text, text) to anon, authenticated;

-- 5) 관리자 목록의 신청일을 프로필 생성일이 아니라 계정 가입일로 고친다
create or replace function public.admin_list_signups()
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
           p.status, u.created_at, p.approved_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by (p.status = 'pending') desc, u.created_at desc;
end;
$$;
