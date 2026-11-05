import { primaryButton } from "@/lib/button-styles";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { DeletePostButton } from "@/components/delete-post-button";
import { PostNotes } from "@/components/post-notes";
import { SkeletonBar, SkeletonGroup } from "@/components/skeleton";
import { formatPostDate } from "@/lib/format";
import { getPost, getPostNotes } from "@/lib/posts";

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
  const [post, notes] = await Promise.all([getPost(id), getPostNotes(id)]);
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
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="태그">
            {post.tags.map((tag) => (
              <li key={tag}>
                {/* 누르면 이 태그가 붙은 글 목록으로 */}
                <Link
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex h-11 items-center rounded-full bg-surface px-4 text-sm text-text-muted transition-[color,transform] duration-100 ease-out hover:text-text active:scale-[0.97]"
                >
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* 원래 글은 그대로, 아래에 날짜별로 지금의 생각을 덧붙인다 */}
        <PostNotes postId={post.id} initialNotes={notes} />
      </article>

      {/* 하단 고정: 지우기 / 고치기 */}
      <BottomBar className="flex items-center justify-between">
        <DeletePostButton postId={post.id} />
        <Link
          href={`/posts/${post.id}/edit`}
          className={primaryButton}
        >
          고치기
        </Link>
      </BottomBar>
    </>
  );
}

function PostSkeleton() {
  return (
    <SkeletonGroup label="글을 불러오는 중" className="flex flex-1 flex-col gap-3 pt-4">
      <SkeletonBar className="h-3.5 w-24" />
      <SkeletonBar className="h-7 w-2/3" />
      <SkeletonBar className="mt-4 h-4 w-full" />
      <SkeletonBar className="h-4 w-full" />
      <SkeletonBar className="h-4 w-1/2" />
    </SkeletonGroup>
  );
}
