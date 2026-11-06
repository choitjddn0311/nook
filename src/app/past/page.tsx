import type { Metadata } from "next";
import { Suspense } from "react";
import { PostListItem } from "@/components/post-list-item";
import { SkeletonBar, SkeletonGroup } from "@/components/skeleton";
import { formatPostDate } from "@/lib/format";
import type { SeoulDate } from "@/lib/on-this-day";
import { getPastGroups } from "@/lib/past-posts";

export const metadata: Metadata = { title: "지난 생각 · Nook" };

export default function PastPage() {
  return (
    <div className="flex flex-1 flex-col pt-4 pb-10">
      <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">지난 생각</h1>
      <p className="mt-2 text-base leading-relaxed text-text-muted">지난 오늘, 나는 무슨 생각을 했을까요.</p>
      {/* 로그인 쿠키로 DB를 읽어야 해서 요청 때 그린다 (Cache Components) */}
      <Suspense fallback={<PastSkeleton />}>
        <PastGroups />
      </Suspense>
    </div>
  );
}

// 한국 날짜 → 표시용 "2025년 11월 5일 (수)" (정오 시각으로 만들어 날짜가 밀리지 않게)
const dateLabel = ({ y, m, d }: SeoulDate) =>
  formatPostDate(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T12:00:00+09:00`);

async function PastGroups() {
  const groups = await getPastGroups();

  if (groups.length === 0) {
    return (
      <p className="mt-12 text-base leading-relaxed text-text-muted">
        아직 돌아볼 과거가 없어요. 오늘 쓴 글은 한 달 뒤부터 여기서 다시 만날 수 있어요.
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`past-${group.key}`}>
          <h2 id={`past-${group.key}`} className="text-lg leading-snug font-semibold tracking-[-0.01em] text-text">
            {group.label}
          </h2>
          <p className="text-sm text-text-muted">{dateLabel(group.date)}</p>
          <ul className="mt-1 flex flex-col">
            {group.posts.map((post) => (
              <PostListItem key={post.id} post={post} when="time" />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PastSkeleton() {
  return (
    <SkeletonGroup label="지난 글을 불러오는 중" className="mt-6 flex flex-col gap-3">
      <SkeletonBar className="h-5 w-28" />
      <SkeletonBar className="h-3.5 w-36" />
      <SkeletonBar className="mt-3 h-5 w-2/3" />
      <SkeletonBar className="h-4 w-full" />
    </SkeletonGroup>
  );
}
