// 쓰던 글을 이 기기(브라우저 localStorage)에 임시로 보관한다.
// 인터넷이 끊기거나 창이 닫혀도 다음에 이어서 쓸 수 있게 하는 안전망이다. DB에 저장되면 지운다.
// localStorage는 개인정보 보호 모드 등에서 실패할 수 있으므로 모든 접근을 try/catch로 감싼다.
import type { PostValue } from "@/lib/post-form";

export type Draft = PostValue & { savedAt: number; newId?: string };

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
      newId: typeof d.newId === "string" ? d.newId : undefined,
    };
  } catch {
    return null;
  }
}

// newId: 아직 DB에 없는 새 글에 미리 정해 둔 id. 같은 임시본을 두 번 저장해도 글이 하나만 생기게 한다.
export function writeDraft(postId: string | null, value: PostValue, newId?: string | null) {
  try {
    localStorage.setItem(key(postId), JSON.stringify({ ...value, savedAt: Date.now(), newId: newId ?? undefined }));
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

// 새 글 id 만들기 (UUID v4).
// crypto.randomUUID는 https·localhost에서만 되므로, 폰에서 http://<맥 IP>로 열어도 되도록 getRandomValues로 만든다.
export function newPostId(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
