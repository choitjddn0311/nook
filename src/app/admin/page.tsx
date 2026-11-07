import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignupRow } from "@/components/signup-row";
import { SkeletonBar, SkeletonGroup } from "@/components/skeleton";
import { getSignupsForAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "관리 · Nook" };

// 관리자 첫 화면: 대기·승인·거절 인원 + 승인 대기 목록으로 가는 길 + 처리한 계정 목록.
// 관리자도 다른 사람의 글은 볼 수 없다 (계정 정보만 다룬다).
export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col pt-4 pb-10">
      <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">관리</h1>
      <Suspense fallback={<AdminSkeleton />}>
        <AdminContent />
      </Suspense>
    </div>
  );
}

async function AdminContent() {
  const signups = await getSignupsForAdmin();
  const count = (s: string) => signups.filter((x) => x.status === s).length;
  const pending = count("pending");
  const handled = signups.filter((s) => s.status !== "pending");

  return (
    <>
      <dl className="mt-4 divide-y divide-border">
        {[
          ["승인 대기", pending],
          ["승인된 계정", count("approved")],
          ["거절한 계정", count("rejected")],
        ].map(([label, n]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-[15px] text-text-muted">{label}</dt>
            <dd className="text-xl font-semibold tracking-[-0.01em] text-text tabular-nums">{n}명</dd>
          </div>
        ))}
      </dl>

      <Link
        href="/admin/pending"
        className="mt-4 self-start text-base text-text underline underline-offset-4"
      >
        {pending > 0 ? `승인 대기 ${pending}명 보기` : "승인 대기 목록"}
      </Link>

      <section aria-labelledby="admin-handled" className="mt-10">
        <h2 id="admin-handled" className="text-lg leading-snug font-semibold tracking-[-0.01em] text-text">
          처리한 계정
        </h2>
        {handled.length === 0 ? (
          <p className="mt-3 text-[15px] text-text-muted">아직 처리한 계정이 없어요.</p>
        ) : (
          <ul className="divide-y divide-border">
            {handled.map((s) => (
              <SignupRow key={s.id} signup={s} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function AdminSkeleton() {
  return (
    <SkeletonGroup label="관리 정보를 불러오는 중" className="mt-4 flex flex-col gap-3">
      <SkeletonBar className="h-10 w-full" />
      <SkeletonBar className="h-10 w-full" />
      <SkeletonBar className="h-10 w-full" />
    </SkeletonGroup>
  );
}
