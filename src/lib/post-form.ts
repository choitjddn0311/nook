// 글쓰기·수정 폼에서 받은 값을 정리하고 검사한다.
// (서버 액션 파일에 두면 외부에서 호출 가능한 액션으로 노출되므로 일반 모듈로 분리)

export type EditorState = { error: string | null; title: string; content: string };

const TITLE_MAX = 200;
const CONTENT_MAX = 100_000;

export function readPostForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").replace(/\s+$/, "");

  let error: string | null = null;
  if (!content.trim()) error = "본문을 한 글자 이상 적어 주세요.";
  else if (title.length > TITLE_MAX) error = `제목은 ${TITLE_MAX}자까지 쓸 수 있어요.`;
  else if (content.length > CONTENT_MAX) error = `본문은 ${CONTENT_MAX.toLocaleString()}자까지 쓸 수 있어요.`;

  return { title, content, error };
}
