"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginToEmail } from "@/lib/username";

export type LoginState = { error: string | null; login: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!login || !password) {
    return { error: "아이디와 비밀번호를 모두 입력해 주세요.", login };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: loginToEmail(login), password });

  if (error) {
    // 어떤 칸이 틀렸는지 알려 주지 않는다(계정이 있는지 추측하지 못하게).
    const message =
      error.status === 429
        ? "시도가 너무 많아요. 잠시 후 다시 해 주세요."
        : "아이디 또는 비밀번호가 맞지 않아요.";
    return { error: message, login };
  }

  // 아직 승인되지 않은 계정은 곧장 기다리는 화면으로, 관리자는 대시보드로 (주소창도 맞도록 여기서 정한다)
  const { data: profile } = await supabase.from("profiles").select("status, is_admin").eq("id", data.user.id).maybeSingle();
  redirect(profile?.status !== "approved" ? "/waiting" : profile.is_admin ? "/admin" : "/");
}
