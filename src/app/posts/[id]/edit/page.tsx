import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostEditor } from "@/components/post-editor";
import { SkeletonBar, SkeletonGroup } from "@/components/skeleton";
import { getCurrentUserId } from "@/lib/account";
import { getPostImages } from "@/lib/post-images";
import { getPost } from "@/lib/posts";

export const metadata: Metadata = { title: "글 고치기 · Nook" };

export default function EditPostPage({ params }: PageProps<"/posts/[id]/edit">) {
  return (
    <div className="flex flex-1 flex-col pt-4">
      <h1 className="sr-only">글 고치기</h1>
      <Suspense fallback={<EditorSkeleton />}>
        {params.then(({ id }) => (
          <EditForm id={id} />
        ))}
      </Suspense>
    </div>
  );
}

async function EditForm({ id }: { id: string }) {
  const [post, userId, images] = await Promise.all([getPost(id), getCurrentUserId(), getPostImages(id)]);
  if (!post || !userId) notFound();

  return (
    <PostEditor
      initial={{ id: post.id, title: post.title ?? "", content: post.content, tags: post.tags, format: post.format, updatedAt: post.updated_at, images }}
      userId={userId}
    />
  );
}

// 고칠 글을 불러오는 동안: 제목 + 본문 몇 줄 모양
function EditorSkeleton() {
  return (
    <SkeletonGroup label="고칠 글을 불러오는 중" className="flex flex-1 flex-col gap-3 pt-2">
      <SkeletonBar className="h-8 w-1/2" />
      <SkeletonBar className="mt-4 h-4 w-full" />
      <SkeletonBar className="h-4 w-full" />
      <SkeletonBar className="h-4 w-3/4" />
    </SkeletonGroup>
  );
}
