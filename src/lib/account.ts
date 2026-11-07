import "server-only";
import { createClient } from "@/lib/supabase/server";

// 지금 로그인한 사람의 id (토큰 서명을 검사하는 getClaims 사용). 로그인 안 했으면 null.
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return typeof sub === "string" ? sub : null;
}

export type AccountStatus = "pending" | "approved" | "rejected";
export type Account = { userId: string; status: AccountStatus; isAdmin: boolean; hasPassword: boolean };

// 로그인한 사람의 승인 상태·관리자 여부 (17단계 profiles). 로그인 안 했으면 null.
// 프로필을 못 읽으면 승인 대기로 본다 (데이터는 DB의 RLS가 어차피 막는다).
export async function getAccount(): Promise<Account | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (typeof userId !== "string") return null;

  const { data: profile } = await supabase.from("profiles").select("status, is_admin").eq("id", userId).maybeSingle();
  return {
    userId,
    status: (profile?.status as AccountStatus | undefined) ?? "pending",
    isAdmin: profile?.is_admin ?? false,
    // 소셜 로그인 계정은 비밀번호도 복구 코드도 없다
    hasPassword: data?.claims?.app_metadata?.provider === "email",
  };
}
