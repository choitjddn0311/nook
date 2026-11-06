import { primaryButton, secondaryButton } from "@/lib/button-styles";
import Link from "next/link";
import { Suspense } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { PastBanner } from "@/components/past-banner";
import { PostList, PostListSkeleton } from "@/components/post-list";
import { SearchPanel } from "@/components/search-panel";
import { TagFilter } from "@/components/tag-filter";
import { homeHref, parseHomeFilters } from "@/lib/home-filters";

export default function Home({ searchParams }: PageProps<"/">) {
  // ?q=&tag=&fav= → 거르기 상태. 주소 값은 요청 때만 알 수 있으므로 Suspense 안에서 읽는다 (Cache Components)
  const filtersPromise = searchParams.then(parseHomeFilters);

  return (
    <>
      {/* 지난 오늘 쓴 글이 있는 날에만 보이는 한 줄 안내 */}
      <Suspense fallback={null}>
        <PastBanner />
      </Suspense>

      <Suspense fallback={null}>
        {filtersPromise.then((filters) => (
          <TagFilter filters={filters} />
        ))}
      </Suspense>

      {/* 글 목록은 로그인 쿠키로 DB를 읽어야 해서 요청 때 그린다. 그동안은 자리 표시를 보여 준다. */}
      <Suspense fallback={<PostListSkeleton />}>
        {filtersPromise.then((filters) => (
          <PostList key={homeHref(filters)} filters={filters} />
        ))}
      </Suspense>

      {/* 하단 고정: 폰에서 엄지가 닿는 곳 */}
      <BottomBar className="flex items-center justify-between gap-2">
        {/* '새 글 쓰기' 위에 떠 있는 찾기 버튼 → 누르면 찾기·정렬 패널 */}
        <Suspense fallback={null}>
          {filtersPromise.then((filters) => (
            <SearchPanel filters={filters} />
          ))}
        </Suspense>
        {/* 15단계 랜덤 생각: 내 글 중 하나를 무작위로 (매번 서버에서 골라야 해서 일반 링크) */}
        <a href="/random" className={secondaryButton}>
          아무 글 보기
        </a>
        <Link href="/write" className={primaryButton}>
          새 글 쓰기
        </Link>
      </BottomBar>
    </>
  );
}
