"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type InquiryState = { error: string | null; email: string; message: string };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// 랜딩 문의하기: 이메일과 문의 내용을 저장하고 감사 페이지로 보낸다. 로그인하지 않아도 된다.
export async function submitInquiry(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const fail = (error: string): InquiryState => ({ error, email, message });

  // 사람에게는 보이지 않는 칸. 채워져 있으면 자동 프로그램이 보낸 것으로 보고 조용히 넘어간다.
  if (String(formData.get("website") ?? "") !== "") redirect("/contact/sent");

  if (!EMAIL.test(email) || email.length > 254) return fail("답장받을 이메일 주소를 확인해 주세요.");
  if (message.length < 5) return fail("문의 내용을 5자 이상 적어 주세요.");
  if (message.length > 2000) return fail("문의 내용은 2000자까지 보낼 수 있어요.");
  if (formData.get("agree") !== "on") return fail("개인정보 수집·이용에 동의해 주세요.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_inquiry", { p_email: email, p_message: message });
  if (error) {
    if (error.code === "P0429") return fail("문의가 너무 많이 들어왔어요. 잠시 뒤에 다시 보내 주세요.");
    return fail("문의를 보내지 못했어요. 잠시 뒤에 다시 보내 주세요.");
  }
  redirect("/contact/sent");
}
