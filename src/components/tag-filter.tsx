import Link from "next/link";
import { fetchAll } from "@/lib/fetch-all";
import { homeHref, type HomeFilters } from "@/lib/home-filters";
import { createClient } from "@/lib/supabase/server";

// 홈 위쪽의 거르기 줄: ★ 즐겨찾기 → 전체 → 내가 쓴 태그(많이 쓴 순).
// 칩을 눌러도 검색어는 유지된다. 태그 칸만 모두 읽어(1000개씩 나눠서) 센다.
export async function TagFilter({ filters }: { filters: HomeFilters }) {
  const active = filters.tag;
  const supabase = await createClient();
  const data = await fetchAll((from, to) => supabase.from("posts").select("tags").order("id").range(from, to));
  if (!data || data.length === 0) return null; // 글이 하나도 없으면 줄 자체를 숨김

  const counts = new Map<string, number>();
  for (const row of data) for (const tag of row.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")).map(([t]) => t);

  // 지금 거르고 있는 태그가 목록에 없으면(오타 주소 등) 그래도 보여 준다
  if (active && !counts.has(active)) tags.unshift(active);

  return (
    // 오른쪽 끝을 서서히 흐리게 해서 칩이 뚝 잘리지 않고 '옆으로 더 있다'는 걸 보여 준다
    <nav
      aria-label="즐겨찾기·태그로 거르기"
      className="-mx-4 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] px-4 pt-2 [scrollbar-width:none] sm:-mx-6 sm:px-6"
    >
      <ul className="flex w-max gap-2 pr-8 pb-2">
        <li>
          {/* 누를 때마다 켜고 끔 (태그와 함께 쓸 수 있다) */}
          <Chip href={homeHref(filters, { fav: !filters.fav })} current={filters.fav}>
            ★ 즐겨찾기
          </Chip>
        </li>
        <li>
          <Chip href={homeHref(filters, { tag: null, fav: false })} current={!active && !filters.fav}>
            전체
          </Chip>
        </li>
        {tags.map((tag) => (
          <li key={tag}>
            <Chip href={homeHref(filters, { tag: active === tag ? null : tag })} current={active === tag}>
              #{tag}
            </Chip>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Chip({ href, current, children }: { href: string; current: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={
        "inline-flex h-11 items-center rounded-full px-4 text-sm whitespace-nowrap transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.97] " +
        (current ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-text-muted hover:text-text")
      }
    >
      {children}
    </Link>
  );
}
