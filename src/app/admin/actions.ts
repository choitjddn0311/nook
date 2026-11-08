"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type StatusResult = { error: string | null };

// 가입 신청 승인·거절. 관리자인지는 DB 함수(admin_set_status)가 직접 확인한다.
export async function setSignupStatus(_prev: StatusResult, formData: FormData): Promise<StatusResult> {
  const target = String(formData.get("target") ?? "");
  const status = formData.get("status");
  if (!target || (status !== "approved" && status !== "rejected")) return { error: "잘못된 요청이에요." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_status", { target, new_status: status });
  if (error) return { error: "바꾸지 못했어요. 잠시 후 다시 해 주세요." };

  refresh(); // 목록·헤더의 대기 인원을 바로 다시 그린다
  return { error: null };
}

export type DeleteResult = { error: string | null };

// 관리자가 계정을 지운다. 자기 자신·다른 관리자는 DB 함수가 거부한다.
export async function deleteAccountAsAdmin(_prev: DeleteResult, formData: FormData): Promise<DeleteResult> {
  const target = String(formData.get("target") ?? "");
  if (!target) return { error: "잘못된 요청이에요." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_account", { target });
  if (error) return { error: error.code === "42501" ? error.message : "지우지 못했어요. 잠시 후 다시 해 주세요." };

  refresh(); // 목록과 현황을 바로 다시 그린다
  return { error: null };
}
