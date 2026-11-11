import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin-nav";
import { getAccount } from "@/lib/account";
import { getInquiriesForAdmin, getSignupsForAdmin } from "@/lib/admin";

// 관리 화면 틀: PC는 사이드바, 폰은 위 줄 + 아래 탭 (AdminNav).
// data-admin: 루트 레이아웃이 이 표시를 보고 일반 헤더를 숨기고 본문 폭 제한을 푼다.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-admin className="flex flex-1 flex-col lg:flex-row">
      {/* 로그인 정보를 읽어야 해서 요청 때 그린다 (Cache Components) */}
      <Suspense fallback={null}>
        <AdminShellNav />
      </Suspense>
      <div className="min-w-0 flex-1 px-4 pt-4 pb-28 lg:px-10 lg:pt-7 lg:pb-12">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
}

// 관리자가 아니면 관리 화면이 있다는 것도 드러내지 않는다(404). 데이터는 DB 함수가 한 번 더 막는다.
async function AdminShellNav() {
  const account = await getAccount();
  if (!account?.isAdmin) notFound();
  const [{ others }, inquiries] = await Promise.all([getSignupsForAdmin(), getInquiriesForAdmin()]);
  const pending = others.filter((s) => s.status === "pending").length;
  const unanswered = inquiries.filter((i) => i.answered_at === null).length;
  return <AdminNav pending={pending} unanswered={unanswered} />;
}
