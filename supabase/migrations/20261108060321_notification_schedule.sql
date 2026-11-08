-- 알림 시간 지정 + 글쓰기 알림
-- 설정은 계정마다 하나(알림을 켠 모든 기기에 같이 적용). 시간은 한국 시간 기준 1시간 단위.
-- 설정이 없는 계정은 지금처럼: 지난 오늘 알림 9시, 글쓰기 알림 꺼짐.

create table public.notification_settings (
  user_id         uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  past_enabled    boolean not null default true,
  past_hour       smallint not null default 9 check (past_hour between 0 and 23),
  write_frequency text not null default 'off' check (write_frequency in ('off', 'daily', 'weekly')),
  write_weekday   smallint not null default 0 check (write_weekday between 0 and 6), -- 0 = 일요일
  write_hour      smallint not null default 21 check (write_hour between 0 and 23),
  updated_at      timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

create policy "본인 알림 설정 읽기" on public.notification_settings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "본인 알림 설정 만들기" on public.notification_settings
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "본인 알림 설정 고치기" on public.notification_settings
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "승인된 사용자만" on public.notification_settings
  as restrictive for all to authenticated using (public.is_approved()) with check (public.is_approved());

revoke all on public.notification_settings from anon;
revoke delete, truncate, references, trigger on public.notification_settings from authenticated;

-- 글쓰기 알림을 보낸 날 (지난 오늘 알림은 기존 last_sent_on)
alter table public.push_subscriptions add column last_write_sent_on date;

-- 지금(한국 시간) 이 시각에 보낼 곳. kind: 'past' 지난 오늘 / 'write' 글쓰기
-- 예약 작업이 매시 정각에 부른다. 같은 날 같은 종류는 한 번만 보낸다.
drop function public.push_targets_today();

create or replace function public.push_targets(p_kind text)
returns table (id uuid, endpoint text, p256dh text, auth text, post_count bigint, frequency text)
language sql
security definer
set search_path = ''
as $$
  with now_kst as (
    select (now() at time zone 'Asia/Seoul') as t
  ),
  today as (
    select t::date as d, extract(hour from t)::int as h, extract(dow from t)::int as dow from now_kst
  ),
  -- 설정이 없는 계정은 기본값으로 본다
  settings as (
    select pr.id as user_id,
           coalesce(ns.past_enabled, true) as past_enabled,
           coalesce(ns.past_hour, 9) as past_hour,
           coalesce(ns.write_frequency, 'off') as write_frequency,
           coalesce(ns.write_weekday, 0) as write_weekday,
           coalesce(ns.write_hour, 21) as write_hour
    from public.profiles pr
    left join public.notification_settings ns on ns.user_id = pr.id
    where pr.status = 'approved'
  ),
  past_days as (
    select (d - interval '1 month')::date as day from today
    union select (d - interval '6 months')::date from today
    union select (d - make_interval(years => n))::date from today, generate_series(1, 100) as n
  ),
  past_counts as (
    select p.user_id, count(*) as post_count
    from public.posts p
    where (p.created_at at time zone 'Asia/Seoul')::date in (select day from past_days)
    group by p.user_id
  )
  -- 지난 오늘: 고른 시각이고, 지난 오늘 쓴 글이 있고, 오늘 아직 안 보낸 기기
  select s.id, s.endpoint, s.p256dh, s.auth, c.post_count, null::text
  from public.push_subscriptions s
  join settings st on st.user_id = s.user_id
  join past_counts c on c.user_id = s.user_id
  where p_kind = 'past'
    and st.past_enabled
    and st.past_hour = (select h from today)
    and s.last_sent_on is distinct from (select d from today)
  union all
  -- 글쓰기: 고른 시각·요일이고, 매일이면 오늘 쓴 글이 없고, 매주면 지난 7일 안에 쓴 글이 없는 기기
  select s.id, s.endpoint, s.p256dh, s.auth, 0::bigint, st.write_frequency
  from public.push_subscriptions s
  join settings st on st.user_id = s.user_id
  where p_kind = 'write'
    and st.write_frequency <> 'off'
    and st.write_hour = (select h from today)
    and (st.write_frequency = 'daily' or st.write_weekday = (select dow from today))
    and s.last_write_sent_on is distinct from (select d from today)
    and not exists (
      select 1 from public.posts p
      where p.user_id = s.user_id
        and (p.created_at at time zone 'Asia/Seoul')::date
            > (select d from today) - case when st.write_frequency = 'weekly' then 7 else 1 end
    );
$$;
revoke all on function public.push_targets(text) from public, anon, authenticated;
grant execute on function public.push_targets(text) to service_role;

-- 예약 작업: 매일 9시 한 번 → 매시 정각 (발송 함수 이름도 send-notifications로 바뀜)
select cron.unschedule('on-this-day-push');
select cron.schedule(
  'send-notifications',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://xiblmttontfescoxpros.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
