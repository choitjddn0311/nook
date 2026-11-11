import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getAccount } from "@/lib/account";
import type { Signup } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

// 관리자 화면용: 관리자가 아니면 없는 페이지(404)처럼 보인다 (관리 화면이 있다는 것도 드러내지 않음).
// 목록은 DB 함수가 한 번 더 관리자인지 확인한다. 관리자 본인 계정은 목록에서 뺀다(현황 숫자에는 포함).
// 관리 화면 틀(배지 숫자)과 각 화면이 같이 쓰므로 cache로 요청당 한 번만 읽는다
export const getSignupsForAdmin = cache(async (): Promise<{ others: Signup[]; all: Signup[] }> => {
  const account = await getAccount();
  if (!account?.isAdmin) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_signups");
  if (error) throw new Error("가입 목록을 불러오지 못했어요.");
  const all = data ?? [];
  return { all, others: all.filter((s) => s.id !== account.userId) };
});

export type Inquiry = { id: string; email: string; message: string; created_at: string; answered_at: string | null };

// 관리자 화면용 문의 목록 (답장 안 한 것 먼저). getSignupsForAdmin과 같은 페이지에서 쓰므로 관리자 확인은 거기서 한다.
export const getInquiriesForAdmin = cache(async (): Promise<Inquiry[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_inquiries");
  if (error) throw new Error("문의 목록을 불러오지 못했어요.");
  return data ?? [];
});
