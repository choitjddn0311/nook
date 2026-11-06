import "server-only";
import { matchPastDay, pastDays, seoulDayRange, todayInSeoul, type PastDay } from "@/lib/on-this-day";
import { createClient } from "@/lib/supabase/server";

export type PastPost = { id: string; title: string | null; content: string; tags: string[]; created_at: string };
export type PastGroup = PastDay & { posts: PastPost[] };

// 한 달 전·6개월 전·지난 해들의 '오늘' 쓴 글을 날짜 구역별로 모아 온다. 글이 없는 구역은 빠진다.
export async function getPastGroups(now?: Date): Promise<PastGroup[]> {
  // 로그인 쿠키를 먼저 읽어 '요청 때 그리는 부분'임을 알린 뒤에 현재 시각을 읽는다
  // (Next 16 Cache Components: 미리 만드는 화면에서는 현재 시각을 쓸 수 없다)
  const supabase = await createClient();

  // 몇 년 전까지 둘러볼지: 가장 오래된 글의 해까지
  const { data: oldest } = await supabase
    .from("posts")
    .select("created_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!oldest) return [];

  const today = todayInSeoul(now ?? new Date());
  const oldestYear = todayInSeoul(new Date(oldest.created_at)).y;
  const days = pastDays(today, oldestYear);

  // 날짜 범위들을 한 번의 조회로: or(and(시작 이상, 끝 미만), …)
  const ranges = days
    .map((day) => {
      const { start, end } = seoulDayRange(day.date);
      return `and(created_at.gte."${start}",created_at.lt."${end}")`;
    })
    .join(",");
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, content, tags, created_at")
    .or(ranges)
    .order("created_at", { ascending: false });
  if (error) throw new Error("지난 글을 불러오지 못했어요.");

  const groups: PastGroup[] = days.map((day) => ({ ...day, posts: [] }));
  for (const post of posts ?? []) {
    const day = matchPastDay(post.created_at, days);
    groups.find((g) => g.key === day?.key)?.posts.push(post);
  }
  return groups.filter((g) => g.posts.length > 0);
}
