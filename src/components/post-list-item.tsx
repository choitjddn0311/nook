import Link from "next/link";
import { formatPostDate, getPostHeadline } from "@/lib/format";

type Item = { id: string; title: string | null; content: string; tags: string[]; created_at: string };

// 글 목록의 한 줄 (날짜 → 제목/첫 줄 → 미리보기 2줄 → 태그). 홈 목록과 '과거의 생각'이 같이 쓴다.
export function PostListItem({ post }: { post: Item }) {
  const { headline, preview } = getPostHeadline(post.title, post.content);
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={`/posts/${post.id}`}
        className="-mx-3 my-1 flex flex-col gap-1 rounded-lg px-3 py-4 transition-colors hover:bg-surface"
      >
        <time dateTime={post.created_at} className="text-sm text-text-muted">
          {formatPostDate(post.created_at)}
        </time>
        <span className="line-clamp-1 text-lg leading-snug font-semibold tracking-[-0.01em] text-text">{headline}</span>
        {preview && <span className="line-clamp-2 text-base leading-relaxed text-text-muted">{preview}</span>}
        {post.tags.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-muted">
            {post.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </span>
        )}
      </Link>
    </li>
  );
}
