import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountList } from "@/components/account-list";
import { AdminSkeleton, AdminTitle } from "@/components/admin-ui";
import { getSignupsForAdmin } from "@/lib/admin";
import { seoulDayKey } from "@/lib/stats";

export const metadata: Metadata = { title: "계정 · 관리 · Nook" };

// 계정 표: 상태별 숫자 → 찾기·거르기 → 계정 · 상태 · 글 · 사진 · 가입일 (글은 개수만)
export default function AdminAccountsPage() {
  return (
    <>
      <AdminTitle>계정</AdminTitle>
      <Suspense fallback={<AdminSkeleton />}>
        <Accounts />
      </Suspense>
    </>
  );
}

async function Accounts() {
  const { all } = await getSignupsForAdmin(); // 관리자가 아니면 404
  const today = seoulDayKey(new Date());
  const users = all.filter((s) => !s.is_admin);
  const stats: [string, number][] = [
    ["전체", all.length],
    ["승인됨", users.filter((s) => s.status === "approved").length],
    ["대기", users.filter((s) => s.status === "pending").length],
    ["거절됨", users.filter((s) => s.status === "rejected").length],
    ["오늘 가입", all.filter((s) => seoulDayKey(new Date(s.created_at)) === today).length],
  ];

  return (
    <section className="lg:mt-4">
      <dl className="flex gap-5 overflow-x-auto border-b border-border pb-4 lg:gap-8">
        {stats.map(([label, value]) => (
          <div key={label} className="shrink-0">
            <dt className="text-[13px] text-text-muted lg:text-[15px]">{label}</dt>
            <dd className="text-xl font-semibold tracking-[-0.02em] text-text tabular-nums lg:text-[22px]">{value.toLocaleString("ko-KR")}</dd>
          </div>
        ))}
      </dl>
      {/* 관리자 본인 줄에는 버튼이 없다(자기 계정은 바꾸거나 지울 수 없음). 최근 가입순 */}
      <AccountList accounts={[...all].sort((a, b) => b.created_at.localeCompare(a.created_at))} />
      <p className="mt-4 text-sm text-text-muted">글과 사진은 개수만 보여요. 관리 화면에서는 글 내용과 사진을 볼 수 없어요.</p>
    </section>
  );
}
