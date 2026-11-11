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

// Markdown 기호를 걷어 내고 글자만 남긴다 (목록 미리보기용, 서식이 아니라 내용만 보이게)
// 예: "# 제목" → "제목", "**굵게**" → "굵게", "[글](주소)" → "글", "- [x] 할 일" → "할 일"
export function stripMarkdown(md: string) {
  return md
    .replace(/```[^\n]*\n?/g, "") // 코드 블록 울타리
    .replace(/<[^>\n]+>/g, "") // HTML 태그 (글 보기에서도 무시되므로 미리보기에서도 뺀다)
    .replace(/!\[([^\]]*)\]\((?:[^()\s]|\([^()]*\))*\)/g, "$1") // 이미지 (주소 안 괄호 한 겹까지)
    .replace(/\[([^\]]*)\]\((?:[^()\s]|\([^()]*\))*\)/g, "$1") // 링크
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // 제목
    .replace(/^\s{0,3}>\s?/gm, "") // 인용
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/gm, "") // 목록·체크 목록
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/gm, "") // 표 구분선
    .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, "") // 가로줄
    .replace(/\|/g, " ") // 표 칸
    .replace(/(\*\*|__)(.+?)\1/g, "$2") // 굵게
    .replace(/(^|[^\w*])\*(?!\s)(.+?)\*(?!\w)/g, "$1$2") // 기울임 (*)
    .replace(/~~(.+?)~~/g, "$1") // 취소선
    .replace(/`([^`]+)`/g, "$1"); // 코드
}

// 목록에 보일 제목과 미리보기.
// 제목이 없으면 본문 첫 줄을 제목처럼 쓰고, 미리보기는 그다음 내용부터 보여 준다.
// Markdown 글은 기호를 걷어 낸 글자로 계산한다.
export function getPostHeadline(title: string | null, rawContent: string, format: "plain" | "markdown" = "plain") {
  const content = format === "markdown" ? stripMarkdown(rawContent) : rawContent;
  const lines = content.split("\n").map((l) => l.replace(/\s+/g, " ").trim());
  if (title?.trim()) {
    return { headline: title.trim(), preview: clip(lines.filter(Boolean).join(" ")) };
  }
  const firstIndex = lines.findIndex(Boolean);
  const headline = firstIndex >= 0 ? lines[firstIndex] : "";
  const preview = lines
    .slice(firstIndex + 1)
    .filter(Boolean)
    .join(" ");
  return { headline: clip(headline), preview: clip(preview) };
}

// 목록은 제목 1줄·미리보기 2줄만 보여 준다 → 본문 전체를 폰으로 보내지 않게 자른다.
// 글자 단위로 잘라 이모지가 반쪽으로 깨지지 않게 한다.
const CLIP_CHARS = 200;
function clip(text: string) {
  const chars = Array.from(text);
  return chars.length > CLIP_CHARS ? chars.slice(0, CLIP_CHARS).join("") : text;
}

// "오후 11:59" — 같은 날 쓴 글을 구분할 때 (한국 시간)
// 서버 환경에 따라 Intl이 "PM 11:59"로 내기도 해서, 24시간 숫자를 받아 '오전/오후'를 직접 붙인다.
const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
export function formatPostTime(iso: string) {
  const parts = timeFormat.formatToParts(new Date(iso));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour < 12 ? "오전" : "오후"} ${h12}:${minute}`;
}
