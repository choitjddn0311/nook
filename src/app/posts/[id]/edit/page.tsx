import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostEditor } from "@/components/post-editor";
import { getPost } from "@/lib/posts";
import { updatePost } from "../actions";

export const metadata: Metadata = { title: "글 고치기 · Nook" };

export default function EditPostPage({ params }: PageProps<"/posts/[id]/edit">) {
  return (
    <div className="flex flex-1 flex-col pt-4">
      <h1 className="sr-only">글 고치기</h1>
      <Suspense fallback={null}>
        {params.then(({ id }) => (
          <EditForm id={id} />
        ))}
      </Suspense>
    </div>
  );
}

async function EditForm({ id }: { id: string }) {
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <PostEditor
      action={updatePost.bind(null, post.id)}
      initial={{ title: post.title ?? "", content: post.content }}
      submitLabel="저장"
      pendingLabel="저장하는 중…"
      cancelHref={`/posts/${post.id}`}
    />
  );
}
