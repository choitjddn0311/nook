"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EditorState = { error: string | null; title: string; content: string };

const TITLE_MAX = 200;
const CONTENT_MAX = 100_000;

// 폼에서 받은 값을 정리하고 검사한다. 수정(7단계)에서도 같이 쓴다.
export async function readPostForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").replace(/\s+$/, "");

  let error: string | null = null;
  if (!content.trim()) error = "본문을 한 글자 이상 적어 주세요.";
  else if (title.length > TITLE_MAX) error = `제목은 ${TITLE_MAX}자까지 쓸 수 있어요.`;
  else if (content.length > CONTENT_MAX) error = `본문은 ${CONTENT_MAX.toLocaleString()}자까지 쓸 수 있어요.`;

  return { title, content, error };
}

export async function createPost(_prev: EditorState, formData: FormData): Promise<EditorState> {
  const { title, content, error } = await readPostForm(formData);
  if (error) return { error, title, content };

  const supabase = await createClient();
  // user_id는 넣지 않는다. DB 기본값 auth.uid()가 로그인한 사람으로 채우고, RLS가 한 번 더 확인한다.
  const { error: dbError } = await supabase.from("posts").insert({ title: title || null, content });

  if (dbError) {
    return { error: "저장하지 못했어요. 인터넷 연결을 확인하고 다시 저장해 주세요.", title, content };
  }

  // 6단계에서 글 목록이 생기면 방금 쓴 글이 맨 위에 보인다.
  redirect("/");
}
