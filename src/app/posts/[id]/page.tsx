import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { DeletePostButton } from "@/components/delete-post-button";
import { FavoriteButton } from "@/components/favorite-button";
import { MarkdownView } from "@/components/markdown-view";
import { PostImages } from "@/components/post-images";
import { PostNotes } from "@/components/post-notes";
import { PushPrompt } from "@/components/push-prompt";
import { SkeletonBar, SkeletonGroup } from "@/components/skeleton";
import { primaryButton, secondaryButton } from "@/lib/button-styles";
import { formatPostDate } from "@/lib/format";
import { getPostImages } from "@/lib/post-images";
import { getPost, getPostNotes } from "@/lib/posts";

export const metadata: Metadata = { title: "글 · Nook" };

// from=random: 홈의 '아무 글 보기'·'다른 글'로 들어온 경우 (15단계 랜덤 생각)
// from=only:   '다른 글'을 눌렀는데 이 글 하나뿐인 경우
type From = "random" | "only" | null;

export default function PostPage({ params, searchParams }: PageProps<"/posts/[id]">) {
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
        {Promise.all([params, searchParams]).then(([{ id }, sp]) => (
          <PostView id={id} from={sp.from === "random" || sp.from === "only" ? sp.from : null} />
        ))}
      </Suspense>
    </div>
  );
}

async function PostView({ id, from }: { id: string; from: From }) {
  const [post, notes, images] = await Promise.all([getPost(id), getPostNotes(id), getPostImages(id)]);
  if (!post) notFound();

  // 1분 넘게 지나서 고쳤으면 '고친 날'도 보여 준다
  const edited = new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 60_000;

  return (
    <>
      <article className="flex-1 pt-4 pb-12">
        <header className="flex flex-col gap-2">
          {from === "random" && <p className="text-sm text-text-muted">아무 글이나 꺼낸 글이에요.</p>}
          {from === "only" && (
            <p role="status" className="rounded-lg bg-surface px-3 py-2 text-sm text-text">
              다른 글이 아직 없어요. 글이 더 쌓이면 여기서 하나씩 꺼내 볼 수 있어요.
            </p>
          )}
          {/* 날짜 줄 오른쪽에 ☆/★ 즐겨찾기 */}
          <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-text-muted">
            <time dateTime={post.created_at}>{formatPostDate(post.created_at)}</time>
            {edited && (
              <span>
                {" "}
                <span aria-hidden="true">/</span> 고친 날 <time dateTime={post.updated_at}>{formatPostDate(post.updated_at)}</time>
              </span>
            )}
          </p>
            <FavoriteButton postId={post.id} initial={post.is_favorite} />
          </div>
          {post.title ? (
            <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">{post.title}</h1>
          ) : (
            <h1 className="sr-only">제목 없는 글</h1>
          )}
        </header>

        {/* Markdown 글은 서식으로(서버에서 그려 보냄), 일반 글은 줄바꿈을 그대로 살려서 */}
        {post.format === "markdown" ? (
          <div className="mt-6">
            <MarkdownView content={post.content} />
          </div>
        ) : (
          <div className="mt-6 text-[17px] leading-[1.8] whitespace-pre-wrap text-text">{post.content}</div>
        )}

        <PostImages images={images} />

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

      {/* 글을 쓰고 '완료'로 왔을 때 한 번: 알림을 켤지 묻는다 */}
      <PushPrompt />

      {/* 하단 고정: 지우기 / (다른 글) 고치기 */}
      <BottomBar className="flex items-center justify-between gap-2">
        <DeletePostButton postId={post.id} />
        <div className="flex items-center gap-2">
          {from === "random" && (
            // 매번 서버에서 새로 골라야 해서 Link(미리 불러오기) 대신 일반 링크
            <a href={`/random?except=${post.id}`} className={secondaryButton}>
              다른 글
            </a>
          )}
          <Link href={`/posts/${post.id}/edit`} className={primaryButton}>
            고치기
          </Link>
        </div>
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
