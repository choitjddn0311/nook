import type { Metadata } from "next";
import { PostEditor } from "@/components/post-editor";

export const metadata: Metadata = { title: "새 글 · Nook" };

const EMPTY = { id: null, title: "", content: "", tags: [], format: "plain" as const, updatedAt: null };

export default function WritePage() {
  return (
    <div className="flex flex-1 flex-col pt-4">
      <h1 className="sr-only">새 글 쓰기</h1>
      {/* 자동 저장: 본문을 쓰기 시작하면 글이 만들어지고, 주소가 이 글의 고치기 주소로 바뀐다 */}
      <PostEditor initial={EMPTY} />
    </div>
  );
}
