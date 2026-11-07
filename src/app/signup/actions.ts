"use server";

import { redirect } from "next/navigation";
import { CONSENT_VERSION } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";
import { loginToEmail, usernameError } from "@/lib/username";

export type SignupState = { error: string | null; username: string; code: string | null };

export async function signup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const fail = (error: string): SignupState => ({ error, username, code: null });

  const invalid = usernameError(username);
  if (invalid) return fail(invalid);
  if (password.length < 8) return fail("비밀번호는 8자 이상이어야 해요.");
  if (password !== confirm) return fail("비밀번호가 서로 달라요.");
  if (formData.get("agree") !== "on") return fail("필수 항목을 확인하고 체크해 주세요.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: loginToEmail(username),
    password,
    // 언제 어떤 버전에 동의했는지 계정에 남긴다
    options: { data: { consent_version: CONSENT_VERSION, consented_at: new Date().toISOString() } },
  });

  if (error) {
    if (error.code === "signup_disabled") return fail("지금은 가입 준비 중이에요. 조금만 기다려 주세요.");
    if (error.code === "user_already_exists") return fail("이미 쓰고 있는 아이디예요.");
    if (error.code === "weak_password") return fail("더 어려운 비밀번호를 써 주세요.");
    if (error.status === 429) return fail("시도가 너무 많아요. 잠시 후 다시 해 주세요.");
    return fail("가입하지 못했어요. 잠시 후 다시 해 주세요.");
  }

  // 가입과 동시에 로그인된다. 복구 코드를 만들어 한 번 보여 준다.
  const { data: code } = await supabase.rpc("create_recovery_code");
  // 코드를 못 만들었으면 기다리는 화면에서 다시 만들 수 있다
  if (!code) redirect("/waiting");
  return { error: null, username, code };
}
