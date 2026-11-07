import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignupRow } from "@/components/signup-row";
import { SkeletonBar, SkeletonGroup } from "@/components/skeleton";
import { getSignupsForAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "승인 대기 · Nook" };

// 관리자: 가입 신청을 하나씩 승인하거나 거절한다. 오래 기다린 순서대로 위에서부터.
export default function AdminPendingPage() {
  return (
    <div className="flex flex-1 flex-col pt-4 pb-10">
      <Link href="/admin" className="-ml-1 self-start px-1 text-sm text-text-muted hover:text-text">
        ← 관리
      </Link>
      <h1 className="mt-4 text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">승인 대기</h1>
      <Suspense
        fallback={
          <SkeletonGroup label="승인 대기 목록을 불러오는 중" className="mt-4 flex flex-col gap-3">
            <SkeletonBar className="h-12 w-full" />
            <SkeletonBar className="h-12 w-full" />
          </SkeletonGroup>
        }
      >
        <PendingList />
      </Suspense>
    </div>
  );
}

async function PendingList() {
  const pending = (await getSignupsForAdmin())
    .filter((s) => s.status === "pending")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  if (pending.length === 0) {
    return <p className="mt-4 text-base leading-relaxed text-text-muted">기다리는 신청이 없어요.</p>;
  }
  return (
    <ul className="mt-2 divide-y divide-border">
      {pending.map((s) => (
        <SignupRow key={s.id} signup={s} />
      ))}
    </ul>
  );
}
