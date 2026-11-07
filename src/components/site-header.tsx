import Link from "next/link";
import { Suspense } from "react";
import { NavLink } from "@/components/nav-link";
import { NookLogo } from "@/components/nook-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAccount } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-2 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 sm:px-4 sm:pt-[max(1.25rem,env(safe-area-inset-top))]">
      <Link
        href="/"
        aria-label="Nook"
        className="inline-flex min-h-11 items-center rounded-md px-2 text-text"
      >
        <NookLogo className="h-5 w-auto" />
      </Link>
      <div className="flex items-center gap-1">
        {/* 로그인 여부는 쿠키를 읽어야 알 수 있다. 이 부분만 요청 때 그리고, 헤더 나머지는 미리 만들어 둔다. */}
        <Suspense fallback={null}>
          <SignedInLinks />
        </Suspense>
        <ThemeToggle />
      </div>
    </header>
  );
}

// 승인된 계정에만 보이는 헤더 링크: (관리) · 지난 생각 · 나(마이페이지). 로그아웃은 마이페이지 맨 아래.
// 승인 대기 중인 계정은 갈 수 있는 곳이 없으므로 링크를 보여 주지 않는다.
async function SignedInLinks() {
  const account = await getAccount();
  if (account?.status !== "approved") return null;

  return (
    <>
      {account.isAdmin && <AdminLink />}
      <NavLink href="/past">지난 생각</NavLink>
      <NavLink href="/me" label="마이페이지">
        나
      </NavLink>
    </>
  );
}

// 관리자에게만: '관리' 링크 + 승인 대기 인원 (있을 때만 숫자)
async function AdminLink() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_signups");
  const pending = (data ?? []).filter((s) => s.status === "pending").length;
  return (
    <NavLink href="/admin" label={pending > 0 ? `관리, 승인 대기 ${pending}명` : "관리"}>
      관리{pending > 0 && <span className="ml-1 tabular-nums">{pending}</span>}
    </NavLink>
  );
}
