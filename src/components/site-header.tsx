import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-2 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 sm:px-4 sm:pt-[max(1.25rem,env(safe-area-inset-top))]">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-md px-2 text-xl font-semibold tracking-[-0.02em] text-text"
      >
        Nook
      </Link>
      <div className="flex items-center gap-1">
        {/* 로그인 여부는 쿠키를 읽어야 알 수 있다. 이 부분만 요청 때 그리고, 헤더 나머지는 미리 만들어 둔다. */}
        <Suspense fallback={null}>
          <LogoutButton />
        </Suspense>
        <ThemeToggle />
      </div>
    </header>
  );
}

async function LogoutButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;

  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-text-muted transition-[color,transform] duration-100 ease-out hover:text-text active:scale-95"
      >
        로그아웃
      </button>
    </form>
  );
}
