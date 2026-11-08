-- 지난 오늘 알림 (웹 푸시)
-- 알림을 켠 기기의 푸시 주소를 보관한다. 글 내용은 다루지 않는다.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create table public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint     text not null unique,  -- 브라우저 푸시 서비스(Apple, Google, Mozilla 등)가 준 기기 주소
  p256dh       text not null,         -- 알림 내용을 암호화할 기기 공개 키
  auth         text not null,
  created_at   timestamptz not null default now(),
  last_sent_on date                    -- 마지막으로 보낸 날(한국 날짜). 같은 날 두 번 보내지 않는다
);
create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- 본인 것만 보고 지운다. 넣기는 아래 함수로만 한다(기기 주인이 바뀌는 경우 처리).
create policy "본인 구독 읽기" on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "본인 구독 지우기" on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));
create policy "승인된 사용자만" on public.push_subscriptions
  as restrictive for all to authenticated using (public.is_approved()) with check (public.is_approved());

revoke all on public.push_subscriptions from anon;
revoke insert, update on public.push_subscriptions from authenticated;

-- 알림 켜기: 이 기기의 주소를 내 계정에 묶는다.
-- 같은 기기에서 다른 계정이 알림을 켰던 적이 있으면 그 연결은 지운다(기기 주소는 그 기기만 안다).
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_approved() then
    raise exception 'not allowed';
  end if;
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 or length(p_p256dh) > 200 or length(p_auth) > 100 then
    raise exception 'invalid subscription';
  end if;
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id <> (select auth.uid());
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values ((select auth.uid()), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth;
end;
$$;
revoke all on function public.save_push_subscription(text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text) to authenticated;

-- 오늘(한국 날짜) 보낼 곳: 승인된 계정 중 한 달 전·6개월 전·n년 전 오늘 쓴 글이 있고, 오늘 아직 안 보낸 기기.
-- 글은 개수만 센다. 발송 함수(Edge Function, service_role)만 부를 수 있다.
-- 날짜 계산은 src/lib/on-this-day.ts와 같다: 그 달에 그날이 없으면 그 달 마지막 날 (3/31의 한 달 전 → 2/28)
create or replace function public.push_targets_today()
returns table (id uuid, endpoint text, p256dh text, auth text, post_count bigint)
language sql
security definer
set search_path = ''
as $$
  with today as (
    select (now() at time zone 'Asia/Seoul')::date as d
  ),
  days as (
    select (d - interval '1 month')::date as day from today
    union select (d - interval '6 months')::date from today
    union select (d - make_interval(years => n))::date from today, generate_series(1, 100) as n
  ),
  counts as (
    select p.user_id, count(*) as post_count
    from public.posts p
    where (p.created_at at time zone 'Asia/Seoul')::date in (select day from days)
    group by p.user_id
  )
  select s.id, s.endpoint, s.p256dh, s.auth, c.post_count
  from public.push_subscriptions s
  join counts c on c.user_id = s.user_id
  join public.profiles pr on pr.id = s.user_id and pr.status = 'approved'
  where s.last_sent_on is distinct from (select d from today);
$$;
revoke all on function public.push_targets_today() from public, anon, authenticated;
grant execute on function public.push_targets_today() to service_role;

-- 예약 작업이 발송 함수를 부를 때 쓰는 비밀 값. DB 안(Vault)에서 만들어 바깥에 나오지 않는다.
select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'push_cron_secret');

-- 발송 함수가 받은 비밀 값이 맞는지 확인 (service_role만)
create or replace function public.check_push_cron_secret(p_secret text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'push_cron_secret' and decrypted_secret = p_secret);
$$;
revoke all on function public.check_push_cron_secret(text) from public, anon, authenticated;
grant execute on function public.check_push_cron_secret(text) to service_role;

-- 매일 한국 시간 9시(UTC 0시)에 발송 함수를 부른다
select cron.schedule(
  'on-this-day-push',
  '0 0 * * *',
  $$
  select net.http_post(
    url := 'https://xiblmttontfescoxpros.supabase.co/functions/v1/on-this-day-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
