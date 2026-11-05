// 쓰던 글을 이 기기(브라우저 localStorage)에 임시로 보관한다.
// 인터넷이 끊기거나 창이 닫혀도 다음에 이어서 쓸 수 있게 하는 안전망이다. DB에 저장되면 지운다.
// localStorage는 개인정보 보호 모드 등에서 실패할 수 있으므로 모든 접근을 try/catch로 감싼다.
import type { PostValue } from "@/lib/post-form";

export type Draft = PostValue & { savedAt: number };

const key = (postId: string | null) => `nook-draft:${postId ?? "new"}`;

export function readDraft(postId: string | null): Draft | null {
  try {
    const raw = localStorage.getItem(key(postId));
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<Draft>;
    if (typeof d.content !== "string" || typeof d.savedAt !== "number") return null;
    return {
      title: typeof d.title === "string" ? d.title : "",
      content: d.content,
      tags: Array.isArray(d.tags) ? d.tags.filter((t) => typeof t === "string") : [],
      savedAt: d.savedAt,
    };
  } catch {
    return null;
  }
}

export function writeDraft(postId: string | null, value: PostValue) {
  try {
    localStorage.setItem(key(postId), JSON.stringify({ ...value, savedAt: Date.now() }));
  } catch {
    // 저장 공간이 없거나 막혀 있으면 기기 보관만 건너뛴다 (DB 저장은 계속된다)
  }
}

export function clearDraft(postId: string | null) {
  try {
    localStorage.removeItem(key(postId));
  } catch {
    // 무시
  }
}

// 두 내용이 같은지 (자동 저장할 필요가 있는지 판단)
export function sameValue(a: PostValue, b: PostValue) {
  return a.title === b.title && a.content === b.content && a.tags.join("\u0000") === b.tags.join("\u0000");
}
