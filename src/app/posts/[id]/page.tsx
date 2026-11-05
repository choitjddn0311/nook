import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DeletePostButton } from "@/components/delete-post-button";
import { formatPostDate } from "@/lib/format";
import { getPost } from "@/lib/posts";

export const metadata: Metadata = { title: "글 · Nook" };

export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <div className="flex flex-1 flex-col">
      <nav className="pt-2">
        <Link
          href="/"
          className="-ml-3 inline-flex min-h-11 items-center rounded-md px-3 text-sm text-text-muted transition-colors hover:text-text"
        >
          ← 목록
        </Link>
      </nav>
      {/* 주소의 글 번호와 글 내용은 요청 때 읽는다 (Cache Components) */}
      <Suspense fallback={<PostSkeleton />}>
        {params.then(({ id }) => (
          <PostView id={id} />
        ))}
      </Suspense>
    </div>
  );
}

async function PostView({ id }: { id: string }) {
  const post = await getPost(id);
  if (!post) notFound();

  // 1분 넘게 지나서 고쳤으면 '고친 날'도 보여 준다
  const edited = new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 60_000;

  return (
    <>
      <article className="flex-1 pt-4 pb-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm text-text-muted">
            <time dateTime={post.created_at}>{formatPostDate(post.created_at)}</time>
            {edited && (
              <span>
                {" "}
                <span aria-hidden="true">/</span> 고친 날 <time dateTime={post.updated_at}>{formatPostDate(post.updated_at)}</time>
              </span>
            )}
          </p>
          {post.title ? (
            <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">{post.title}</h1>
          ) : (
            <h1 className="sr-only">제목 없는 글</h1>
          )}
        </header>

        {/* 줄바꿈을 그대로 살려서 보여 준다 */}
        <div className="mt-6 text-[17px] leading-[1.8] whitespace-pre-wrap text-text">{post.content}</div>

        {post.tags.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-muted" aria-label="태그">
            {post.tags.map((tag) => (
              <li key={tag}>#{tag}</li>
            ))}
          </ul>
        )}
      </article>

      {/* 하단 고정: 지우기 / 고치기 */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-between bg-bg px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6">
        <DeletePostButton postId={post.id} />
        <Link
          href={`/posts/${post.id}/edit`}
          className="inline-flex h-12 min-w-28 items-center justify-center rounded-lg bg-accent px-6 text-base font-semibold text-accent-contrast transition-transform duration-100 ease-out active:scale-[0.98]"
        >
          고치기
        </Link>
      </div>
    </>
  );
}

function PostSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-1 flex-col gap-3 pt-4">
      <div className="h-3.5 w-24 rounded bg-surface" />
      <div className="h-7 w-2/3 rounded bg-surface" />
      <div className="mt-4 h-4 w-full rounded bg-surface" />
      <div className="h-4 w-full rounded bg-surface" />
      <div className="h-4 w-1/2 rounded bg-surface" />
    </div>
  );
}
