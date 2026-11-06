"use server";

import { redirect } from "next/navigation";
import { isPostId } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export type DeleteState = { error: string | null };

export async function deletePost(id: string): Promise<DeleteState> {
  if (!isPostId(id)) return { error: "지울 글을 찾지 못했어요." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").delete().eq("id", id).select("id");

  if (error) return { error: "지우지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요." };
  if (!data || data.length === 0) return { error: "지울 글을 찾지 못했어요. 이미 지워졌을 수 있어요." };

  redirect("/");
}

// 즐겨찾기 켜고 끄기. 별표만 바꾸므로 '고친 날'(updated_at)은 바뀌지 않는다 (DB 트리거가 제목·본문·태그 변경만 셈)
export async function toggleFavorite(id: string, value: boolean): Promise<{ ok: boolean }> {
  if (!isPostId(id) || typeof value !== "boolean") return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").update({ is_favorite: value }).eq("id", id).select("id");
  return { ok: !error && Boolean(data && data.length > 0) };
}
