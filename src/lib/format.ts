// 날짜·미리보기 표시 도우미.
// 서버는 UTC 시간대로 돌 수 있으므로, 날짜는 항상 한국 시간으로 계산한다(사용자는 나 혼자, 한국).

const TIME_ZONE = "Asia/Seoul";

// 연·월·일·요일을 한국 시간 기준 '조각'으로 받아서 직접 이어 붙인다.
// (Intl 기본 출력은 연도 유무에 따라 괄호 모양이 달라져서 직접 조립한다)
const partsFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

function seoulParts(date: Date) {
  const parts = partsFormat.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day"), weekday: get("weekday") };
}

// "11월 5일 (목)" — 올해가 아니면 "2025년 3월 1일 (토)"
export function formatPostDate(iso: string, now: Date = new Date()) {
  const d = seoulParts(new Date(iso));
  const thisYear = seoulParts(now).year;
  const base = `${d.month}월 ${d.day}일 (${d.weekday})`;
  return d.year === thisYear ? base : `${d.year}년 ${base}`;
}

// 목록에 보일 제목과 미리보기.
// 제목이 없으면 본문 첫 줄을 제목처럼 쓰고, 미리보기는 그다음 내용부터 보여 준다.
export function getPostHeadline(title: string | null, content: string) {
  const lines = content.split("\n").map((l) => l.trim());
  if (title?.trim()) {
    return { headline: title.trim(), preview: lines.filter(Boolean).join(" ") };
  }
  const firstIndex = lines.findIndex(Boolean);
  const headline = firstIndex >= 0 ? lines[firstIndex] : "";
  const preview = lines
    .slice(firstIndex + 1)
    .filter(Boolean)
    .join(" ");
  return { headline, preview };
}
