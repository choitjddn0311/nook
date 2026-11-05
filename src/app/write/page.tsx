import type { Metadata } from "next";
import { PostEditor } from "@/components/post-editor";
import { createPost } from "./actions";

export const metadata: Metadata = { title: "새 글 · Nook" };

export default function WritePage() {
  return (
    <div className="flex flex-1 flex-col pt-4">
      <h1 className="sr-only">새 글 쓰기</h1>
      <PostEditor action={createPost} submitLabel="저장" pendingLabel="저장하는 중…" cancelHref="/" />
    </div>
  );
}
