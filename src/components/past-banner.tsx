import Link from "next/link";
import { getPastGroups } from "@/lib/past-posts";

// 홈 맨 위 한 줄: 지난 오늘 쓴 글이 있는 날에만 보인다 → '지난 생각' 화면으로
export async function PastBanner() {
  const groups = await getPastGroups();
  const count = groups.reduce((sum, g) => sum + g.posts.length, 0);
  if (count === 0) return null;

  // 한 구역에 한 편이면 "1년 전 오늘 쓴 글이 있어요", 아니면 개수로
  const text =
    groups.length === 1 && count === 1 ? `${groups[0].label} 쓴 글이 있어요` : `지난 오늘 쓴 글이 ${count}개 있어요`;

  return (
    <Link
      href="/past"
      className="mt-2 flex min-h-11 items-center justify-between gap-3 rounded-lg bg-surface px-4 py-2.5 text-[15px] text-text transition-[transform] duration-100 ease-out active:scale-[0.99]"
    >
      <span>{text}</span>
      <span className="shrink-0 text-sm text-text-muted">보기</span>
    </Link>
  );
}
