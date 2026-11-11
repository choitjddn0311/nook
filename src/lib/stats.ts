// 16단계 '생각 통계' 계산. 날짜는 모두 한국 시간 기준.
// 입력: 내 글들의 작성 시각과 태그 (DB에서 받아 온 그대로). 계산은 순수 함수라 서버·시험 어디서나 같게 돈다.

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// "2026-11-06" 같은 한국 날짜 키
export const seoulDayKey = (d: Date) => dayFormat.format(d);

// 날짜 키 ↔ 날짜 계산용 (UTC 자정으로 두고 하루씩 더하고 뺀다)
const keyToUtc = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const utcToKey = (t: number) => new Date(t).toISOString().slice(0, 10);
const DAY = 86_400_000;
const addDays = (key: string, n: number) => utcToKey(keyToUtc(key) + n * DAY);

export type ThinkingStats = {
  total: number; // 전체 기록 수
  daysWritten: number; // 글을 쓴 날 수
  currentStreak: number; // 지금 이어지는 연속 기록 일수
  wroteToday: boolean;
  longestStreak: number;
  months: { key: string; label: string; count: number; isCurrent: boolean }[]; // 최근 12개월 (오래된 → 최근)
  topTags: { tag: string; count: number }[]; // 많이 쓴 순 5개
  calendar: {
    weeks: ({ key: string; count: number } | null)[][]; // 53주 × 7일(일~토). 오늘 이후 칸은 null
    monthMarks: { week: number; label: string }[]; // 달이 바뀌는 주 위에 '11월' 표시
    maxCount: number;
  };
};

export function computeStats(posts: { created_at: string; tags: string[] }[], now: Date = new Date()): ThinkingStats {
  const today = seoulDayKey(now);

  // 날짜별 글 수
  const perDay = new Map<string, number>();
  for (const p of posts) {
    const key = seoulDayKey(new Date(p.created_at));
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }

  // 연속 기록: 오늘 아직 안 썼어도 어제까지 이어졌으면 유지한다
  const wroteToday = perDay.has(today);
  let currentStreak = 0;
  for (let key = wroteToday ? today : addDays(today, -1); perDay.has(key); key = addDays(key, -1)) currentStreak++;

  // 가장 긴 연속 기록
  let longestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of [...perDay.keys()].sort()) {
    run = prev && addDays(prev, 1) === key ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    prev = key;
  }

  // 최근 12개월
  const [ty, tm] = today.split("-").map(Number);
  const months: ThinkingStats["months"] = [];
  for (let i = 11; i >= 0; i--) {
    const total = ty * 12 + (tm - 1) - i;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;
    let count = 0;
    for (const [day, c] of perDay) if (day.startsWith(key)) count += c;
    // 1월이거나 맨 앞 막대면 연도도 함께 (해가 바뀌는 걸 알 수 있게)
    const label = m === 1 || i === 11 ? `${String(y).slice(2)}년 ${m}월` : `${m}월`;
    months.push({ key, label, count, isCurrent: i === 0 });
  }

  // 자주 쓴 태그
  const tagCounts = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  // 활동 달력: 최근 53주. 마지막 열은 오늘이 들어 있는 주(일요일 시작)
  const todayDow = new Date(keyToUtc(today)).getUTCDay(); // 0=일
  const lastSunday = addDays(today, -todayDow);
  const firstSunday = addDays(lastSunday, -52 * 7);
  const weeks: ThinkingStats["calendar"]["weeks"] = [];
  const monthMarks: ThinkingStats["calendar"]["monthMarks"] = [];
  let maxCount = 0;
  let lastMonth = "";
  for (let w = 0; w < 53; w++) {
    const week: ({ key: string; count: number } | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const key = addDays(firstSunday, w * 7 + d);
      if (key > today) {
        week.push(null);
        continue;
      }
      const count = perDay.get(key) ?? 0;
      maxCount = Math.max(maxCount, count);
      week.push({ key, count });
    }
    // 이 주의 첫날이 속한 달이 바뀌면 그 주 위에 달 이름 (맨 앞 주는 달이 덜 차 있으면 생략)
    const firstKey = addDays(firstSunday, w * 7);
    const month = firstKey.slice(0, 7);
    if (month !== lastMonth) {
      if (w > 0 || Number(firstKey.slice(8)) <= 7) monthMarks.push({ week: w, label: `${Number(firstKey.slice(5, 7))}월` });
      lastMonth = month;
    }
    weeks.push(week);
  }

  return {
    total: posts.length,
    daysWritten: perDay.size,
    currentStreak,
    wroteToday,
    longestStreak,
    months,
    topTags,
    calendar: { weeks, monthMarks, maxCount },
  };
}

// 오늘(todayKey)까지 days일 동안 날짜별 개수 (관리 개요의 가입 막대). 시각은 한국 날짜로 센다.
export function dailyCounts(isoTimes: string[], todayKey: string, days: number) {
  const end = Date.parse(todayKey);
  const keys = Array.from({ length: days }, (_, i) => new Date(end - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10));
  const counts = new Map(keys.map((k) => [k, 0]));
  for (const iso of isoTimes) {
    const key = seoulDayKey(new Date(iso));
    const n = counts.get(key);
    if (n !== undefined) counts.set(key, n + 1);
  }
  return keys.map((day) => ({ day, count: counts.get(day) ?? 0 }));
}
