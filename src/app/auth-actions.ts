"use server";

import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export type RegenerateState = { code: string | null; error: string | null };

// 복구 코드 다시 만들기 (로그인한 본인). 이전 코드는 무효가 된다.
export async function regenerateRecoveryCode(): Promise<RegenerateState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_recovery_code");
  if (error || !data) return { code: null, error: "만들지 못했어요. 잠시 후 다시 해 주세요." };
  return { code: data, error: null };
}

// 사용법 안내를 봤다고 기록한다 (본인 것만)
export async function completeOnboarding() {
  const supabase = await createClient();
  await supabase.rpc("complete_onboarding");
}
