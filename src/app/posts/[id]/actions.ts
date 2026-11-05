"use server";

import { redirect } from "next/navigation";
import { readPostForm, type EditorState } from "@/lib/post-form";
import { isPostId } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

// 수정 화면에서 .bind(null, id) 로 글 번호를 미리 넣어 쓴다.
export async function updatePost(id: string, _prev: EditorState, formData: FormData): Promise<EditorState> {
  const { title, content, error } = readPostForm(formData);
  if (error) return { error, title, content };
  if (!isPostId(id)) return { error: "고칠 글을 찾지 못했어요.", title, content };

  const supabase = await createClient();
  // RLS 때문에 남의 글이면 0줄이 바뀐다 → select로 실제로 바뀌었는지 확인
  const { data, error: dbError } = await supabase
    .from("posts")
    .update({ title: title || null, content })
    .eq("id", id)
    .select("id");

  if (dbError) return { error: "저장하지 못했어요. 인터넷 연결을 확인하고 다시 저장해 주세요.", title, content };
  if (!data || data.length === 0) return { error: "고칠 글을 찾지 못했어요. 이미 지워졌을 수 있어요.", title, content };

  redirect(`/posts/${id}`);
}

export type DeleteState = { error: string | null };

export async function deletePost(id: string): Promise<DeleteState> {
  if (!isPostId(id)) return { error: "지울 글을 찾지 못했어요." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").delete().eq("id", id).select("id");

  if (error) return { error: "지우지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요." };
  if (!data || data.length === 0) return { error: "지울 글을 찾지 못했어요. 이미 지워졌을 수 있어요." };

  redirect("/");
}
