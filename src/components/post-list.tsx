import Link from "next/link";
import { PostListItem } from "@/components/post-list-item";
import { SkeletonBar, SkeletonGroup } from "@/components/skeleton";
import { hasAnyFilter, searchCondition, type HomeFilters } from "@/lib/home-filters";
import { createClient } from "@/lib/supabase/server";

// 한 번에 불러오는 글 수. 글이 많아지면 '더 보기'를 붙인다(지금은 MVP).
const PAGE_SIZE = 100;

export async function PostList({ filters }: { filters: HomeFilters }) {
  const { q, tag, fav } = filters;
  const supabase = await createClient();
  // RLS 때문에 내 글만 온다. 그래도 필요한 칸만 고른다.
  let query = supabase
    .from("posts")
    .select("id, title, content, tags, created_at, is_favorite, format")
    .order("created_at", { ascending: false }) // 항상 최신순
    .limit(PAGE_SIZE);
  if (q) query = query.or(searchCondition(q)); // 제목 또는 본문에 검색어가 들어간 글
  if (tag) query = query.contains("tags", [tag]); // tags 배열에 그 태그가 있는 글 (GIN 인덱스)
  if (fav) query = query.eq("is_favorite", true);
  const { data, error } = await query;
  // PostgREST는 ilike 안의 '*'를 와일드카드(%)로 바꿔 버려서 이스케이프할 방법이 없다.
  // 검색어에 '*'가 있으면 서버 결과(더 넓게 걸린 결과)를 글자 그대로 한 번 더 걸러 정확히 맞춘다.
  const posts = q && q.includes("*") ? data?.filter((p) => matchesLiteral(p, q)) : data;

  if (error) {
    return (
      <p role="alert" className="py-16 text-base text-text">
        글을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.
      </p>
    );
  }

  const filtered = hasAnyFilter(filters);

  if (!posts || posts.length === 0) {
    if (!filtered) {
      return (
        <section className="flex flex-1 flex-col justify-center py-16">
          <p className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">아직 적어 둔 글이 없어요.</p>
          <p className="mt-3 text-base leading-relaxed text-text-muted">
            떠오른 생각, 오늘 있었던 일, 잊고 싶지 않은 문장을 이곳에 하나씩 모아 두세요.
          </p>
        </section>
      );
    }
    return (
      <section className="flex flex-1 flex-col justify-center py-16">
        <p className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">{emptyMessage(filters)}</p>
        <Link href="/" className="mt-3 self-start text-base text-text-muted underline underline-offset-4 hover:text-text">
          모든 글 보기
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="post-list-title" className="flex-1 pt-2 pb-6">
      <h1 id="post-list-title" className="sr-only">
        {filtered ? describe(filters) : "내 글 목록"}
      </h1>
      {/* 거르기가 걸려 있을 때만: 무엇으로 보고 있는지 + 모두 지우기 */}
      {filtered && (
        <div className="flex items-center justify-between gap-3 pt-2 pb-1 text-sm">
          <p className="min-w-0 truncate text-text-muted" aria-live="polite">
            {describe(filters)} {posts.length}개
          </p>
          <Link href="/" className="shrink-0 text-text-muted underline underline-offset-4 hover:text-text">
            모두 지우기
          </Link>
        </div>
      )}
      <ul className="flex flex-col">
        {posts.map((post) => (
          <PostListItem key={post.id} post={post} />
        ))}
      </ul>
    </section>
  );
}

function matchesLiteral(post: { title: string | null; content: string }, q: string) {
  const needle = q.toLowerCase();
  return (post.title ?? "").toLowerCase().includes(needle) || post.content.toLowerCase().includes(needle);
}

// "'비' 검색 · #일기 · 즐겨찾기" 처럼 지금 거르기를 한 줄로
function describe({ q, tag, fav }: HomeFilters) {
  const parts = [q && `'${q}' 검색`, tag && `#${tag}`, fav && "즐겨찾기"].filter(Boolean);
  return parts.length ? parts.join(" · ") : "모든 글";
}

function emptyMessage({ q, tag, fav }: HomeFilters) {
  if (q && !tag && !fav) return `'${q}'가 들어간 글이 없어요.`;
  if (tag && !q && !fav) return `#${tag} 태그가 붙은 글이 없어요.`;
  if (fav && !q && !tag) return "아직 즐겨찾기한 글이 없어요.";
  return "조건에 맞는 글이 없어요.";
}

// 목록을 불러오는 동안 보이는 자리 표시. 막대 위로 옅은 빛이 지나간다.
export function PostListSkeleton() {
  return (
    <SkeletonGroup label="글 목록을 불러오는 중" className="flex-1 pt-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2 border-b border-border py-5 last:border-b-0">
          <SkeletonBar className="h-3.5 w-24" />
          <SkeletonBar className="h-5 w-2/3" />
          <SkeletonBar className="h-4 w-full" />
        </div>
      ))}
    </SkeletonGroup>
  );
}
