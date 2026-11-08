"use server";

import { removeImageFiles } from "@/lib/post-images";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = { error: string | null; done: boolean };

// 비밀번호 바꾸기: 현재 비밀번호를 확인한 뒤 바꾸고, 다른 기기의 로그인을 끊는다.
export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const fail = (error: string): PasswordState => ({ error, done: false });

  if (!current) return fail("현재 비밀번호를 입력해 주세요.");
  if (next.length < 8) return fail("새 비밀번호는 8자 이상이어야 해요.");
  if (next !== confirm) return fail("새 비밀번호가 서로 달라요.");

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return fail("다시 로그인해 주세요.");

  const check = await supabase.auth.signInWithPassword({ email: data.user.email, password: current });
  if (check.error) {
    return fail(check.error.status === 429 ? "시도가 너무 많아요. 잠시 후 다시 해 주세요." : "현재 비밀번호가 맞지 않아요.");
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    if (error.code === "same_password") return fail("지금과 다른 비밀번호를 써 주세요.");
    if (error.code === "weak_password") return fail("더 어려운 비밀번호를 써 주세요.");
    return fail("바꾸지 못했어요. 잠시 후 다시 해 주세요.");
  }

  await supabase.auth.signOut({ scope: "others" });
  return { error: null, done: true };
}

export type DeleteAccountState = { error: string | null; done: boolean };

// 탈퇴: '탈퇴'를 직접 입력하고, 비밀번호가 있는 계정은 비밀번호도 확인한다.
export async function deleteAccount(_prev: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const fail = (error: string): DeleteAccountState => ({ error, done: false });
  if (String(formData.get("confirm") ?? "").trim() !== "탈퇴") return fail("'탈퇴'를 정확히 입력해 주세요.");

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return fail("다시 로그인해 주세요.");

  if (data.user.app_metadata?.provider === "email" && data.user.email) {
    const check = await supabase.auth.signInWithPassword({
      email: data.user.email,
      password: String(formData.get("password") ?? ""),
    });
    if (check.error) {
      return fail(check.error.status === 429 ? "시도가 너무 많아요. 잠시 후 다시 해 주세요." : "비밀번호가 맞지 않아요.");
    }
  }

  // 사진 파일은 계정과 함께 자동으로 지워지지 않아서 먼저 지운다 (남으면 매일 정리 함수가 지운다)
  const { data: images } = await supabase.from("post_images").select("path");
  await removeImageFiles((images ?? []).map((i) => i.path));

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return fail("탈퇴하지 못했어요. 잠시 후 다시 해 주세요.");

  // 계정이 사라졌으므로 이 기기의 로그인 쿠키만 지운다
  await supabase.auth.signOut({ scope: "local" });
  return { error: null, done: true };
}
