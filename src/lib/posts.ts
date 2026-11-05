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
    .select("id, title, content, tags, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("글을 불러오지 못했어요.");
  return data;
}
