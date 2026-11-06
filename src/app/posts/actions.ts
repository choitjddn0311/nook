"use server";

import { validatePost } from "@/lib/post-form";
import { isPostId } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export type SaveResult = { ok: true; id: string; updatedAt: string } | { ok: false; error: string };

// 자동 저장. isNew면 화면이 미리 정한 id로 새 글을 만들고, 아니면 그 글을 고친다.
// 화면(autosaver)이 입력이 멈출 때마다 부른다.
export async function savePost(input: {
  id: string;
  isNew: boolean;
  title: string;
  content: string;
  tags: string[];
  format: "plain" | "markdown";
}): Promise<SaveResult> {
  const { title, content, tags, format, error } = validatePost(input);
  if (error) return { ok: false, error };
  if (!isPostId(input.id)) return { ok: false, error: "글을 찾지 못했어요." };

  const supabase = await createClient();
  const row = { title: title || null, content, tags, format };

  if (input.isNew) {
    // user_id는 넣지 않는다. DB 기본값 auth.uid() + RLS가 로그인한 사람으로 채우고 확인한다.
    const { data, error: dbError } = await supabase
      .from("posts")
      .insert({ id: input.id, ...row })
      .select("id, updated_at")
      .single();
    if (data) return { ok: true, id: data.id, updatedAt: data.updated_at };
    // 23505 = 이미 같은 id가 있음: 앞선 저장이 이미 도착한 경우 → 새로 만들지 않고 아래에서 고친다
    if (dbError?.code !== "23505") return { ok: false, error: "저장하지 못했어요." };
  }

  // RLS 때문에 남의 글이면 0줄이 바뀐다 → select로 실제로 바뀌었는지 확인
  const { data, error: dbError } = await supabase.from("posts").update(row).eq("id", input.id).select("id, updated_at");
  if (dbError) return { ok: false, error: "저장하지 못했어요." };
  if (!data || data.length === 0) return { ok: false, error: "이 글을 찾지 못했어요. 이미 지워졌을 수 있어요." };
  return { ok: true, id: data[0].id, updatedAt: data[0].updated_at };
}
