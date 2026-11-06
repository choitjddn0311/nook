-- Nook: 즐겨찾기 — 13단계 '생각 보관함'
-- Supabase에 적용된 마이그레이션 add_post_favorites (버전 20261106060107)와 같은 내용.

-- 즐겨찾기 칸 (RLS·권한은 기존 posts 정책이 그대로 적용된다)
alter table public.posts add column is_favorite boolean not null default false;
-- 즐겨찾기 거르기용: 즐겨찾기한 글만 담는 작은 인덱스
create index posts_user_favorite_idx on public.posts (user_id, created_at desc) where is_favorite;

-- 수정 시각 트리거: 제목·본문·태그가 바뀔 때만 updated_at 갱신
-- (별표만 눌러도 '고친 날'이 바뀌거나, 자동 저장이 기기 임시본과 비교할 기준 시각이 흔들리지 않게)
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.title, new.content, new.tags) is distinct from (old.title, old.content, old.tags) then
    new.updated_at = now();
  end if;
  return new;
end;
$$;
