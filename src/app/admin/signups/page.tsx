import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSkeleton, AdminTitle } from "@/components/admin-ui";
import { SignupRow } from "@/components/signup-row";
import { getSignupsForAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "승인 대기 · 관리 · Nook" };

// 승인 대기 전체 (먼저 신청한 사람부터)
export default function AdminSignupsPage() {
  return (
    <>
      <AdminTitle>승인 대기</AdminTitle>
      <Suspense fallback={<AdminSkeleton />}>
        <Waiting />
      </Suspense>
    </>
  );
}

async function Waiting() {
  const { others } = await getSignupsForAdmin(); // 관리자가 아니면 404
  const waiting = others.filter((s) => s.status === "pending").sort((a, b) => a.created_at.localeCompare(b.created_at));
  return (
    <section className="lg:mt-4">
      <p className="text-[15px] text-text-muted">
        <span className="tabular-nums">{waiting.length.toLocaleString("ko-KR")}</span>명이 기다리고 있어요. 먼저 신청한 사람부터 보여요.
      </p>
      {waiting.length === 0 ? (
        <p className="mt-6 text-[15px] text-text-muted">기다리는 신청이 없어요.</p>
      ) : (
        <ul className="mt-2 max-w-3xl divide-y divide-border">
          {waiting.map((s) => (
            <SignupRow key={s.id} signup={s} variant="pending" />
          ))}
        </ul>
      )}
    </section>
  );
}
