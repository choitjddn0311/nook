import Link from "next/link";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal";

// 약관·개인정보 처리방침 공통 모양: 글을 읽기 좋게, 장식 없이
export function LegalDocument({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="pt-6 pb-16">
      <Link href="/" className="-ml-1 inline-flex min-h-11 items-center px-1 text-sm text-text-muted hover:text-text">
        ← 처음으로
      </Link>
      <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-[-0.02em] text-text">{title}</h1>
      <p className="mt-2 text-sm text-text-muted">시행일: {LEGAL_EFFECTIVE_DATE}</p>
      <div className="mt-8 flex flex-col gap-8">{children}</div>
    </article>
  );
}

export function LegalSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-lg leading-snug font-semibold tracking-[-0.01em] text-text">{title}</h2>
      <div className="mt-2 flex flex-col gap-2 text-[15px] leading-relaxed text-text-muted [&_strong]:font-semibold [&_strong]:text-text [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

// 작은 표: 폰에서는 옆으로 밀지 않아도 다 읽히게 줄마다 세로로 쌓는다
export function LegalTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="w-full border-collapse text-left text-sm max-sm:block">
      <thead className="max-sm:sr-only">
        <tr className="border-b border-border">
          {head.map((h) => (
            <th key={h} scope="col" className="py-2 pr-4 font-semibold text-text">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="max-sm:block">
        {rows.map((row) => (
          <tr key={row.join()} className="border-b border-border align-top max-sm:block max-sm:py-3">
            {row.map((cell, i) => (
              <td key={i} className="py-2 pr-4 max-sm:flex max-sm:gap-3 max-sm:py-0.5 max-sm:pr-0">
                <span aria-hidden="true" className="w-14 shrink-0 font-medium text-text sm:hidden">
                  {head[i]}
                </span>
                <span>{cell}</span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 작은 링크 묶음: 대기 화면, 마이페이지 아래에
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <p className={`flex gap-4 text-sm text-text-muted ${className}`}>
      {/* 작성지침: 처리방침 링크는 다른 고지와 구분되게 (여기서는 굵기와 진하기로) */}
      <Link href="/privacy" className="inline-flex min-h-11 items-center font-semibold text-text">
        개인정보 처리방침
      </Link>
      <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-text">
        이용약관
      </Link>
    </p>
  );
}
