import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-2 pt-3 pb-2 sm:px-4 sm:pt-5">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-md px-2 font-serif text-xl font-semibold tracking-tight text-text"
      >
        Nook
      </Link>
      <ThemeToggle />
    </header>
  );
}
