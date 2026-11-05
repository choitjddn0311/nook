"use server";

import { redirect } from "next/navigation";
import { readPostForm, type EditorState } from "@/lib/post-form";
import { createClient } from "@/lib/supabase/server";

export async function createPost(_prev: EditorState, formData: FormData): Promise<EditorState> {
  const { title, content, tags, error } = readPostForm(formData);
  if (error) return { error, title, content, tags };

  const supabase = await createClient();
  // user_id는 넣지 않는다. DB 기본값 auth.uid()가 로그인한 사람으로 채우고, RLS가 한 번 더 확인한다.
  const { error: dbError } = await supabase.from("posts").insert({ title: title || null, content, tags });

  if (dbError) {
    return { error: "저장하지 못했어요. 인터넷 연결을 확인하고 다시 저장해 주세요.", title, content, tags };
  }

  redirect("/");
}
