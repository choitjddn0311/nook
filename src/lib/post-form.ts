// 글 내용 검사. 서버(savePost)가 저장 직전에 쓰고, 화면도 같은 규칙으로 미리 판단한다.
// (서버 액션 파일에 두면 외부에서 호출 가능한 액션으로 노출되므로 일반 모듈로 분리)
import { parseTags, validateTags } from "@/lib/tags";

export type PostValue = { title: string; content: string; tags: string[] };

export const TITLE_MAX = 200;
export const CONTENT_MAX = 100_000;

// 화면에서 온 값은 믿지 않는다: 타입부터 확인하고, 다듬은 뒤 규칙을 검사한다.
export function validatePost(input: unknown): PostValue & { error: string | null } {
  const raw = (input ?? {}) as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const content = typeof raw.content === "string" ? raw.content.replace(/\s+$/, "") : "";
  const tagList = Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string") : [];
  const tags = parseTags(tagList);

  let error: string | null = null;
  if (!content.trim()) error = "본문을 한 글자 이상 적어 주세요.";
  else if (title.length > TITLE_MAX) error = `제목은 ${TITLE_MAX}자까지 쓸 수 있어요.`;
  else if (content.length > CONTENT_MAX) error = `본문은 ${CONTENT_MAX.toLocaleString()}자까지 쓸 수 있어요.`;
  else error = validateTags(tags);

  return { title, content, tags, error };
}
