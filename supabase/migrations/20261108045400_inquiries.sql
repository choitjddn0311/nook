-- 랜딩 문의하기
-- 로그인 없이도 보낼 수 있다. 저장은 함수로만, 읽기·처리는 관리자 함수로만 한다.
-- 처리방침: 답장을 마친 날부터 1년이 지나면 자동으로 지운다(아래 예약 작업).

create table public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,           -- 답장받을 이메일
  message     text not null,
  user_id     uuid references auth.users (id) on delete set null, -- 로그인한 채 보냈다면 (탈퇴하면 연결만 끊김)
  created_at  timestamptz not null default now(),
  answered_at timestamptz              -- 답장을 마친 때 (관리자가 표시)
);
create index inquiries_created_at_idx on public.inquiries (created_at desc);

-- 정책을 두지 않아 일반 계정·비로그인은 표를 직접 읽거나 쓸 수 없다
alter table public.inquiries enable row level security;
revoke all on public.inquiries from anon, authenticated;

-- 문의 보내기: 값 모양을 확인하고, 도배를 막는다
-- - 같은 이메일로 1시간에 3건까지
-- - 전체 하루 200건까지 (넘으면 잠시 막고, 운영자가 확인)
create or replace function public.submit_inquiry(p_email text, p_message text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_message text := trim(p_message);
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  if length(v_message) < 5 or length(v_message) > 2000 then
    raise exception 'invalid message' using errcode = '22023';
  end if;
  if (select count(*) from public.inquiries where email = v_email and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.inquiries where created_at > now() - interval '1 day') >= 200 then
    raise exception 'too many' using errcode = 'P0429';
  end if;
  insert into public.inquiries (email, message, user_id) values (v_email, v_message, (select auth.uid()));
end;
$$;
revoke all on function public.submit_inquiry(text, text) from public;
grant execute on function public.submit_inquiry(text, text) to anon, authenticated;

-- 관리자: 문의 목록 (답장 안 한 것 먼저, 오래된 순)
create or replace function public.admin_list_inquiries()
returns table (id uuid, email text, message text, created_at timestamptz, answered_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin) then
    raise exception 'not allowed';
  end if;
  return query
    select i.id, i.email, i.message, i.created_at, i.answered_at
    from public.inquiries i
    order by (i.answered_at is not null), i.created_at;
end;
$$;
revoke all on function public.admin_list_inquiries() from public, anon;
grant execute on function public.admin_list_inquiries() to authenticated;

-- 관리자: 답장 표시 / 되돌리기 / 지우기
create or replace function public.admin_update_inquiry(target uuid, action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin) then
    raise exception 'not allowed';
  end if;
  if action = 'answered' then
    update public.inquiries set answered_at = now() where id = target;
  elsif action = 'unanswered' then
    update public.inquiries set answered_at = null where id = target;
  elsif action = 'delete' then
    delete from public.inquiries where id = target;
  else
    raise exception 'invalid action';
  end if;
end;
$$;
revoke all on function public.admin_update_inquiry(uuid, text) from public, anon;
grant execute on function public.admin_update_inquiry(uuid, text) to authenticated;

-- 보관 기간: 답장을 마친 날부터 1년이 지난 문의는 매일 자동으로 지운다 (한국 시간 새벽 4시)
select cron.schedule(
  'delete-old-inquiries',
  '0 19 * * *',
  $$ delete from public.inquiries where answered_at < now() - interval '1 year' $$
);
