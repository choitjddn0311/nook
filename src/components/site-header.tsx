import Link from "next/link";
import { Suspense } from "react";
import { NavLink } from "@/components/nav-link";
import { NookLogo } from "@/components/nook-logo";
import { ThemeToggle } from "@/components/theme-toggle";
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

// 로그인했을 때만 보이는 헤더 링크: 지난 생각 · 나(마이페이지). 로그아웃은 마이페이지 맨 아래로 옮겼다.
async function SignedInLinks() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;

  return (
    <>
      <NavLink href="/past">지난 생각</NavLink>
      <NavLink href="/me" label="마이페이지">
        나
      </NavLink>
    </>
  );
}
