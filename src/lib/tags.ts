// 태그 규칙. 화면(태그 입력칸)과 서버(저장 전 검사)가 같은 규칙을 쓴다.

export const TAG_MAX_COUNT = 10; // DB 제약 posts_tags_max 와 같은 값
export const TAG_MAX_LENGTH = 20;

// 엔터·쉼표·공백으로 태그를 나눈다.
export const TAG_SEPARATOR = /[,\s]+/;

// "#일기 " → "일기". 앞의 #은 떼고, 앞뒤 공백을 지운다. 빈 문자열이면 null.
export function normalizeTag(raw: string): string | null {
  const tag = raw.trim().replace(/^#+/, "").trim();
  return tag ? tag : null;
}

// 여러 개를 한 번에 정리: 나누기 → 정리 → 중복 제거(영문은 대소문자 무시)
export function parseTags(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    for (const part of value.split(TAG_SEPARATOR)) {
      const tag = normalizeTag(part);
      if (!tag) continue;
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(tag);
    }
  }
  return result;
}

export function validateTags(tags: string[]): string | null {
  if (tags.length > TAG_MAX_COUNT) return `태그는 ${TAG_MAX_COUNT}개까지 붙일 수 있어요.`;
  const tooLong = tags.find((t) => t.length > TAG_MAX_LENGTH);
  if (tooLong) return `태그는 ${TAG_MAX_LENGTH}자까지 쓸 수 있어요. (#${tooLong.slice(0, 10)}…)`;
  return null;
}
