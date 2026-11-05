import Link from "next/link";
import { PostListItem } from "@/components/post-list-item";
import { SkeletonBar, SkeletonGroup } from "@/components/skeleton";
import { createClient } from "@/lib/supabase/server";

// 한 번에 불러오는 글 수. 글이 많아지면 '더 보기'를 붙인다(지금은 MVP).
const PAGE_SIZE = 100;

export async function PostList({ tag }: { tag: string | null }) {
  const supabase = await createClient();
  // RLS 때문에 내 글만 온다. 그래도 필요한 칸만 고른다.
  let query = supabase
    .from("posts")
    .select("id, title, content, tags, created_at")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  // 태그로 거르기: tags 배열에 그 태그가 들어 있는 글만 (GIN 인덱스 사용)
  if (tag) query = query.contains("tags", [tag]);
  const { data: posts, error } = await query;

  if (error) {
    return (
      <p role="alert" className="py-16 text-base text-text">
        글을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.
      </p>
    );
  }

  if ((!posts || posts.length === 0) && tag) {
    return (
      <section className="flex flex-1 flex-col justify-center py-16">
        <p className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">#{tag} 태그가 붙은 글이 없어요.</p>
        <Link href="/" className="mt-3 self-start text-base text-text-muted underline underline-offset-4 hover:text-text">
          모든 글 보기
        </Link>
      </section>
    );
  }

  if (!posts || posts.length === 0) {
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
    <section aria-labelledby="post-list-title" className="flex-1 pt-2 pb-6">
      <h1 id="post-list-title" className="sr-only">
        {tag ? `#${tag} 태그가 붙은 글` : "내 글 목록"}
      </h1>
      <ul className="flex flex-col">
        {posts.map((post) => (
          <PostListItem key={post.id} post={post} />
        ))}
      </ul>
    </section>
  );
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
