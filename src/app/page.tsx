import { primaryButton } from "@/lib/button-styles";
import Link from "next/link";
import { Suspense } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { PastBanner } from "@/components/past-banner";
import { PostList, PostListSkeleton } from "@/components/post-list";
import { TagFilter } from "@/components/tag-filter";
import { normalizeTag } from "@/lib/tags";

export default function Home({ searchParams }: PageProps<"/">) {
  // ?tag=일기 → "일기". 주소 값은 요청 때만 알 수 있으므로 Suspense 안에서 읽는다 (Cache Components)
  const tagPromise = searchParams.then(({ tag }) => normalizeTag(typeof tag === "string" ? tag : ""));

  return (
    <>
      {/* 지난 오늘 쓴 글이 있는 날에만 보이는 한 줄 안내 */}
      <Suspense fallback={null}>
        <PastBanner />
      </Suspense>

      <Suspense fallback={null}>
        {tagPromise.then((tag) => (
          <TagFilter active={tag} />
        ))}
      </Suspense>

      {/* 글 목록은 로그인 쿠키로 DB를 읽어야 해서 요청 때 그린다. 그동안은 자리 표시를 보여 준다. */}
      <Suspense fallback={<PostListSkeleton />}>
        {tagPromise.then((tag) => (
          <PostList key={tag ?? ""} tag={tag} />
        ))}
      </Suspense>

      {/* 하단 고정: 폰에서 엄지가 닿는 곳 */}
      <BottomBar className="flex justify-end">
        <Link
          href="/write"
          className={primaryButton}
        >
          새 글 쓰기
        </Link>
      </BottomBar>
    </>
  );
}
