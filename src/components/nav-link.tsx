"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 헤더 링크. 지금 보고 있는 화면이면 본문색으로 진하게 + aria-current (어디에 있는지 알 수 있게)
export function NavLink({ href, label, tour, children }: { href: string; label?: string; tour?: string; children: React.ReactNode }) {
  const current = usePathname() === href;
  return (
    <Link
      href={href}
      aria-label={label}
      data-tour={tour}
      aria-current={current ? "page" : undefined}
      className={
        "inline-flex min-h-11 items-center rounded-md px-2.5 text-sm transition-[color,transform] duration-100 ease-out active:scale-95 " +
        (current ? "font-semibold text-text" : "text-text-muted hover:text-text")
      }
    >
      {children}
    </Link>
  );
}
