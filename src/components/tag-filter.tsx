import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// 홈 위쪽의 태그 거르기 줄. 내가 쓴 태그를 많이 쓴 순서로 보여 준다.
// 글이 몇천 개가 되기 전까지는 태그 칸만 모두 읽어 와서 세는 것으로 충분하다.
export async function TagFilter({ active }: { active: string | null }) {
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("tags");

  const counts = new Map<string, number>();
  for (const row of data ?? []) for (const tag of row.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")).map(([t]) => t);

  // 지금 거르고 있는 태그가 목록에 없으면(오타 주소 등) 그래도 보여 준다
  if (active && !counts.has(active)) tags.unshift(active);
  if (tags.length === 0) return null;

  return (
    <nav aria-label="태그로 거르기" className="-mx-4 overflow-x-auto px-4 pt-2 sm:-mx-6 sm:px-6">
      <ul className="flex w-max gap-2 pb-2">
        <li>
          <Chip href="/" current={!active}>
            전체
          </Chip>
        </li>
        {tags.map((tag) => (
          <li key={tag}>
            <Chip href={`/?tag=${encodeURIComponent(tag)}`} current={active === tag}>
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
