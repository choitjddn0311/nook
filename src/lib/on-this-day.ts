// '과거의 생각' 날짜 계산. 모두 한국 시간(+09:00) 기준이다.
// 예: 오늘이 2026-11-05라면 → 한 달 전 2026-10-05, 6개월 전 2026-05-05, 1년 전 2025-11-05 …

export type SeoulDate = { y: number; m: number; d: number }; // m: 1~12

const seoulDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// 지금 이 순간의 한국 날짜
export function todayInSeoul(now: Date = new Date()): SeoulDate {
  const [y, m, d] = seoulDateFormat.format(now).split("-").map(Number);
  return { y, m, d };
}

// 그 달의 마지막 날 (2월은 윤년 고려)
function lastDayOf(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// n개월 전 같은 날. 그 달에 그날이 없으면 그 달 마지막 날로 맞춘다 (3/31의 한 달 전 → 2/28 또는 2/29)
export function monthsAgo(date: SeoulDate, n: number): SeoulDate {
  const total = date.y * 12 + (date.m - 1) - n;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return { y, m, d: Math.min(date.d, lastDayOf(y, m)) };
}

const pad = (n: number) => String(n).padStart(2, "0");

// 그날 한국 시간 00:00 ~ 다음 날 00:00 (DB 조회용 ISO 문자열)
export function seoulDayRange({ y, m, d }: SeoulDate) {
  const start = `${y}-${pad(m)}-${pad(d)}T00:00:00+09:00`;
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const end = `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}T00:00:00+09:00`;
  return { start, end };
}

export function sameDate(a: SeoulDate, b: SeoulDate) {
  return a.y === b.y && a.m === b.m && a.d === b.d;
}

// 둘러볼 날짜 목록: 한 달 전, 6개월 전, 그리고 1년 전부터 가장 오래된 글의 해까지 매해 '오늘'
// 같은 날이 겹치면(예: 12개월 전 = 1년 전) 한 번만 넣는다.
export type PastDay = { key: string; label: string; date: SeoulDate };

export function pastDays(today: SeoulDate, oldestYear: number): PastDay[] {
  const days: PastDay[] = [
    { key: "m1", label: "한 달 전 오늘", date: monthsAgo(today, 1) },
    { key: "m6", label: "6개월 전 오늘", date: monthsAgo(today, 6) },
  ];
  for (let years = 1; today.y - years >= oldestYear; years++) {
    days.push({ key: `y${years}`, label: `${years}년 전 오늘`, date: monthsAgo(today, years * 12) });
  }
  return days.filter((day, i) => days.findIndex((other) => sameDate(other.date, day.date)) === i);
}

// 글이 쓰인 시각(ISO)이 어느 '지난 날'에 속하는지
export function matchPastDay(iso: string, days: PastDay[]): PastDay | undefined {
  const t = Date.parse(iso);
  return days.find((day) => {
    const { start, end } = seoulDayRange(day.date);
    return t >= Date.parse(start) && t < Date.parse(end);
  });
}
