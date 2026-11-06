-- Nook: 글마다 '일반 / Markdown' 방식 — 12단계
-- Supabase에 적용된 마이그레이션 add_post_format (버전 20261106062306)와 같은 내용.

-- 방식 칸. 이미 있는 글은 모두 'plain'(일반). RLS·권한은 기존 posts 정책 그대로.
alter table public.posts
  add column format text not null default 'plain'
  constraint posts_format_check check (format in ('plain', 'markdown'));

-- 수정 시각 트리거: 방식만 바꿔도 보이는 모양이 달라지므로 format 변경도 '고친 날'에 포함
-- (별표 is_favorite 변경은 여전히 제외)
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.title, new.content, new.tags, new.format) is distinct from (old.title, old.content, old.tags, old.format) then
    new.updated_at = now();
  end if;
  return new;
end;
$$;
