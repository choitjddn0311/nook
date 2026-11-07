"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null; email: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 입력해 주세요.", email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // 어떤 칸이 틀렸는지 알려 주지 않는다(계정이 있는지 추측하지 못하게).
    const message =
      error.status === 429
        ? "시도가 너무 많아요. 잠시 후 다시 해 주세요."
        : "이메일 또는 비밀번호가 맞지 않아요.";
    return { error: message, email };
  }

  // 아직 승인되지 않은 계정은 곧장 기다리는 화면으로 (주소창도 /waiting 이 되도록 여기서 정한다)
  const { data: profile } = await supabase.from("profiles").select("status").eq("id", data.user.id).maybeSingle();
  redirect(profile?.status === "approved" ? "/" : "/waiting");
}
