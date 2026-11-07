"use server";

import { createClient } from "@/lib/supabase/server";

export type RecoverState = { error: string | null; login: string; code: string | null };

const WRONG = "아이디 또는 복구 코드가 맞지 않아요. 5번 틀리면 1시간 동안 잠겨요.";

// 복구 코드로 비밀번호 다시 정하기. 없는 계정·틀린 코드·잠김을 구분해서 알려 주지 않는다.
export async function recover(_prev: RecoverState, formData: FormData): Promise<RecoverState> {
  const login = String(formData.get("login") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const fail = (error: string): RecoverState => ({ error, login, code: null });

  if (!login || !code) return fail("아이디와 복구 코드를 모두 입력해 주세요.");
  if (password.length < 8) return fail("새 비밀번호는 8자 이상이어야 해요.");
  if (password !== confirm) return fail("새 비밀번호가 서로 달라요.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reset_password_with_code", {
    identifier: login,
    code,
    new_password: password,
  });

  if (error?.code === "22023") return fail("새 비밀번호는 8자 이상, 너무 길지 않게 써 주세요.");
  if (error) return fail("다시 정하지 못했어요. 잠시 후 다시 해 주세요.");
  if (!data) return fail(WRONG);
  return { error: null, login, code: data };
}
