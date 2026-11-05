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
