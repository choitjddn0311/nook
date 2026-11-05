"use client";

import { primaryButton, quietButton } from "@/lib/button-styles";
import Link from "next/link";

// 화면을 그리다 오류가 났을 때 (Next 기본 영어 오류 화면 대신)
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="flex flex-1 flex-col justify-center py-16">
      <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">화면을 불러오지 못했어요.</h1>
      <p className="mt-3 text-base leading-relaxed text-text-muted">
        인터넷 연결을 확인하고 다시 시도해 주세요. 쓰던 글은 이 기기에 보관돼 있어요.
      </p>
      <div className="mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className={primaryButton}
        >
          다시 시도
        </button>
        <Link
          href="/"
          className={quietButton}
        >
          목록으로
        </Link>
      </div>
    </section>
  );
}
