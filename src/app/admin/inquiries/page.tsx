import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSkeleton, AdminTitle } from "@/components/admin-ui";
import { InquiryRow } from "@/components/inquiry-row";
import { getInquiriesForAdmin, getSignupsForAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "문의 · 관리 · Nook" };

// 문의 전체 (답장 전이 먼저)
export default function AdminInquiriesPage() {
  return (
    <>
      <AdminTitle>문의</AdminTitle>
      <Suspense fallback={<AdminSkeleton />}>
        <Inquiries />
      </Suspense>
    </>
  );
}

async function Inquiries() {
  await getSignupsForAdmin(); // 관리자가 아니면 404 (문의 목록은 DB 함수가 한 번 더 막는다)
  const inquiries = await getInquiriesForAdmin();
  const unanswered = inquiries.filter((i) => i.answered_at === null).length;
  return (
    <section className="lg:mt-4">
      <p className="text-[15px] text-text-muted">
        답장 전 <span className="tabular-nums">{unanswered.toLocaleString("ko-KR")}</span>건 · 답장한 문의는 1년 뒤 자동으로 지워져요.
      </p>
      {inquiries.length === 0 ? (
        <p className="mt-6 text-[15px] text-text-muted">받은 문의가 없어요.</p>
      ) : (
        <ul className="mt-2 max-w-3xl divide-y divide-border">
          {inquiries.map((i) => (
            <InquiryRow key={i.id} inquiry={i} />
          ))}
        </ul>
      )}
    </section>
  );
}
