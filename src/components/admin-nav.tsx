"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { NookLogo } from "@/components/nook-logo";
import { ThemeToggle } from "@/components/theme-toggle";

// 관리 화면 메뉴. PC(lg 이상)는 왼쪽 사이드바, 폰은 위쪽 "관리 / 화면" 줄 + 아래 아이콘 탭.
// 배지: 처리할 일(승인 대기 · 답장 전 문의)이 있을 때만 숫자.
type Item = { href: string; label: string; icon: React.ReactNode; badge?: number };

export function AdminNav({ pending, unanswered }: { pending: number; unanswered: number }) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: "/admin", label: "개요", icon: <GridIcon /> },
    { href: "/admin/signups", label: "승인 대기", icon: <PersonIcon />, badge: pending },
    { href: "/admin/inquiries", label: "문의", icon: <ChatIcon />, badge: unanswered },
    { href: "/admin/accounts", label: "계정", icon: <PeopleIcon /> },
  ];
  const me: Item = { href: "/admin/me", label: "내 계정", icon: <LockIcon /> };
  const current = [...items, me].find((i) => i.href === pathname) ?? items[0];

  return (
    <>
      {/* PC 사이드바 */}
      <aside className="sticky top-0 hidden h-dvh w-58 shrink-0 flex-col bg-surface px-3 py-5 lg:flex">
        <Link href="/admin" aria-label="Nook 관리" className="flex min-h-11 items-center gap-2 px-2.5 text-text">
          <NookLogo className="h-[18px] w-auto" />
          <span className="rounded-md border border-border px-1.5 text-xs text-text-muted">관리</span>
        </Link>
        <nav aria-label="관리 메뉴" className="mt-4 flex flex-col gap-1">
          {items.map((item) => (
            <SideLink key={item.href} item={item} current={item.href === pathname} />
          ))}
          <p className="px-2.5 pt-4 pb-1 text-xs text-text-muted">설정</p>
          <SideLink item={me} current={me.href === pathname} />
        </nav>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 pl-2.5">
          <LogoutButton />
          <ThemeToggle />
        </div>
      </aside>

      {/* 폰: 위쪽 줄 (지금 화면 이름 + 테마) */}
      <header className="sticky top-0 z-10 flex h-13 items-center justify-between border-b border-border bg-bg px-4 pt-[env(safe-area-inset-top)] lg:hidden">
        <p className="text-[15px] text-text-muted">
          관리 / <span className="font-semibold text-text">{current.label}</span>
        </p>
        <ThemeToggle />
      </header>

      {/* 폰: 아래 아이콘 탭 (엄지가 닿는 곳) */}
      <nav
        aria-label="관리 메뉴"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-bg px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        {[...items, me].map((item) => {
          const on = item.href === pathname;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.badge ? `${item.label} ${item.badge}` : item.label}
              aria-current={on ? "page" : undefined}
              className={`relative grid h-13 flex-1 place-items-center rounded-lg transition-[color,transform] duration-100 ease-out active:scale-95 ${on ? "text-text" : "text-text-muted"}`}
            >
              {item.icon}
              {!!item.badge && <Badge className="absolute top-1.5 left-1/2 ml-1.5">{item.badge}</Badge>}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function SideLink({ item, current }: { item: Item; current: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={current ? "page" : undefined}
      className={`flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 text-[15px] transition-colors ${current ? "bg-bg font-semibold text-text" : "text-text-muted hover:text-text"}`}
    >
      {item.icon}
      {item.label}
      {!!item.badge && <Badge className="ml-auto">{item.badge}</Badge>}
    </Link>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-contrast tabular-nums ${className}`}>
      {children}
    </span>
  );
}

// 아이콘: 장식이라 읽지 않는다(이름은 링크 글자나 aria-label이 준다)
const iconProps = {
  className: "size-5 shrink-0",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function GridIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 5h16v11H8l-4 4z" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .6 3.5 2.3 3.5 5.2" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg {...iconProps}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
