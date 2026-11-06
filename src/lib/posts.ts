import "server-only";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPostId(id: string) {
  return UUID_RE.test(id);
}

// 글 하나 가져오기. 주소가 이상하거나, 없는 글이거나, 남의 글이면(RLS) null.
export async function getPost(id: string) {
  if (!isPostId(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, content, tags, created_at, updated_at, is_favorite")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("글을 불러오지 못했어요.");
  return data;
}

// 글 아래 '덧붙인 생각'들 (오래된 순). RLS 때문에 내 메모만 온다.
export async function getPostNotes(postId: string) {
  if (!isPostId(postId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_notes")
    .select("id, post_id, user_id, content, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw new Error("덧붙인 생각을 불러오지 못했어요.");
  return data ?? [];
}
