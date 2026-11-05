"use server";

import type { PostNote } from "@/lib/database.types";
import { isPostId } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

const NOTE_MAX = 10_000; // DB 제약 post_notes_content_len 과 같은 값

export type NoteResult = { ok: true; note: PostNote } | { ok: false; error: string };

// 글 아래에 지금의 생각을 덧붙인다. 내 글인지는 DB 정책(RLS)이 한 번 더 확인한다.
export async function addNote(postId: string, content: unknown): Promise<NoteResult> {
  const text = typeof content === "string" ? content.replace(/\s+$/, "") : "";
  if (!text.trim()) return { ok: false, error: "덧붙일 생각을 한 글자 이상 적어 주세요." };
  if (text.length > NOTE_MAX) return { ok: false, error: `덧붙이는 생각은 ${NOTE_MAX.toLocaleString()}자까지 쓸 수 있어요.` };
  if (!isPostId(postId)) return { ok: false, error: "이 글을 찾지 못했어요." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_notes")
    .insert({ post_id: postId, content: text })
    .select("id, post_id, user_id, content, created_at")
    .single();
  if (error || !data) return { ok: false, error: "덧붙이지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요." };
  return { ok: true, note: data };
}

export async function deleteNote(noteId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isPostId(noteId)) return { ok: false, error: "지울 생각을 찾지 못했어요." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("post_notes").delete().eq("id", noteId).select("id");
  if (error) return { ok: false, error: "지우지 못했어요. 다시 시도해 주세요." };
  if (!data || data.length === 0) return { ok: false, error: "이미 지워졌을 수 있어요." };
  return { ok: true };
}
