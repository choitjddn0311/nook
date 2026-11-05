"use server";

import { validatePost } from "@/lib/post-form";
import { isPostId } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export type SaveResult = { ok: true; id: string; updatedAt: string } | { ok: false; error: string };

// 자동 저장. id가 없으면 새 글을 만들고, 있으면 그 글을 고친다.
// 화면(use-autosave)이 입력이 멈출 때마다 부른다.
export async function savePost(input: { id: string | null; title: string; content: string; tags: string[] }): Promise<SaveResult> {
  const { title, content, tags, error } = validatePost(input);
  if (error) return { ok: false, error };

  const supabase = await createClient();
  const row = { title: title || null, content, tags };

  if (!input.id) {
    // user_id는 넣지 않는다. DB 기본값 auth.uid() + RLS가 로그인한 사람으로 채우고 확인한다.
    const { data, error: dbError } = await supabase.from("posts").insert(row).select("id, updated_at").single();
    if (dbError || !data) return { ok: false, error: "저장하지 못했어요." };
    return { ok: true, id: data.id, updatedAt: data.updated_at };
  }

  if (!isPostId(input.id)) return { ok: false, error: "고칠 글을 찾지 못했어요." };
  // RLS 때문에 남의 글이면 0줄이 바뀐다 → select로 실제로 바뀌었는지 확인
  const { data, error: dbError } = await supabase
    .from("posts")
    .update(row)
    .eq("id", input.id)
    .select("id, updated_at");
  if (dbError) return { ok: false, error: "저장하지 못했어요." };
  if (!data || data.length === 0) return { ok: false, error: "이 글을 찾지 못했어요. 이미 지워졌을 수 있어요." };
  return { ok: true, id: data[0].id, updatedAt: data[0].updated_at };
}
