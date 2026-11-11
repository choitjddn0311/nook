import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSkeleton, AdminTitle, adminH2, adminPanel } from "@/components/admin-ui";
import { InquiryRow } from "@/components/inquiry-row";
import { SignupRow } from "@/components/signup-row";
import { getInquiriesForAdmin, getSignupsForAdmin } from "@/lib/admin";
import { dailyCounts, seoulDayKey } from "@/lib/stats";

export const metadata: Metadata = { title: "관리 · Nook" };

// 관리 개요: 숫자 4개 → 처리할 일 미리보기(승인 대기 · 답장 전 문의) → 최근 14일 가입.
// 관리자도 다른 사람의 글은 볼 수 없다. 계정 정보와 글·사진 개수만 다룬다.
export default function AdminOverviewPage() {
  return (
    <>
      <AdminTitle>개요</AdminTitle>
      <Suspense fallback={<AdminSkeleton />}>
        <Overview />
      </Suspense>
    </>
  );
}

const PREVIEW = 3; // 미리보기 줄 수. 나머지는 각 화면에서
const DAYS = 14;
const count = (n: number) => n.toLocaleString("ko-KR");

async function Overview() {
  const [{ all, others }, inquiries] = await Promise.all([getSignupsForAdmin(), getInquiriesForAdmin()]);
  const waiting = others.filter((s) => s.status === "pending").sort((a, b) => a.created_at.localeCompare(b.created_at));
  const unanswered = inquiries.filter((i) => i.answered_at === null);
  const daily = dailyCounts(all.map((s) => s.created_at), seoulDayKey(new Date()), DAYS);
  const today = daily[DAYS - 1];
  const thisWeek = daily.slice(-7).reduce((sum, d) => sum + d.count, 0);
  const max = Math.max(1, ...daily.map((d) => d.count));

  const cards: [string, string, string | null][] = [
    ["전체 계정", `${count(all.length)}명`, `이번 주 +${count(thisWeek)}`],
    ["오늘 가입", `${count(today.count)}명`, `어제 ${count(daily[DAYS - 2].count)}명`],
    ["전체 글", `${count(all.reduce((sum, s) => sum + s.post_count, 0))}개`, null],
    ["전체 사진", `${count(all.reduce((sum, s) => sum + s.image_count, 0))}장`, null],
  ];

  return (
    <>
      {/* 폰: 상자 없이 숫자 줄 / PC: 숫자 카드 */}
      <dl className="grid grid-cols-4 gap-2 border-b border-border pb-4 lg:mt-6 lg:gap-3 lg:border-0 lg:pb-0">
        {cards.map(([label, value, sub]) => (
          <div key={label} className="min-w-0 lg:rounded-xl lg:bg-surface lg:px-5 lg:py-4">
            <dt className="truncate text-[13px] text-text-muted lg:text-[15px]">{label}</dt>
            <dd className="text-xl font-semibold tracking-[-0.02em] text-text tabular-nums lg:mt-1 lg:text-[28px]">{value}</dd>
            {sub && <dd className="hidden text-[13px] text-text-muted lg:block">{sub}</dd>}
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-text-muted">글과 사진은 개수만 보여요. 관리 화면에서는 글 내용과 사진을 볼 수 없어요.</p>

      <div className="mt-6 grid gap-8 lg:mt-7 lg:grid-cols-2 lg:gap-6">
        <section aria-labelledby="ov-waiting" className={adminPanel}>
          <Head id="ov-waiting" title="승인 대기" value={`${count(waiting.length)}명`} href="/admin/signups" />
          {waiting.length === 0 ? (
            <p className="mt-3 text-[15px] text-text-muted">기다리는 신청이 없어요.</p>
          ) : (
            <ul className="divide-y divide-border">
              {waiting.slice(0, PREVIEW).map((s) => (
                <SignupRow key={s.id} signup={s} variant="pending" />
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="ov-inquiries" className={adminPanel}>
          <Head id="ov-inquiries" title="답장 전 문의" value={`${count(unanswered.length)}건`} href="/admin/inquiries" />
          {unanswered.length === 0 ? (
            <p className="mt-3 text-[15px] text-text-muted">답장할 문의가 없어요.</p>
          ) : (
            <ul className="divide-y divide-border">
              {unanswered.slice(0, PREVIEW).map((i) => (
                <InquiryRow key={i.id} inquiry={i} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 최근 14일 가입: 막대 높이 = 그날 가입 수 (오늘만 진하게). 폰에서는 숨긴다 */}
      <section aria-labelledby="ov-chart" className={`mt-6 hidden lg:block ${adminPanel}`}>
        <div className="flex items-baseline justify-between">
          <h2 id="ov-chart" className={adminH2}>
            최근 {DAYS}일 가입
          </h2>
          <span className="text-[15px] text-text-muted">
            하루 평균 {(daily.reduce((sum, d) => sum + d.count, 0) / DAYS).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}명
          </span>
        </div>
        <ol className="mt-4 flex h-28 items-end gap-1.5">
          {daily.map((d, i) => (
            <li
              key={d.day}
              title={`${d.day} ${d.count}명`}
              className={`flex-1 rounded-t ${i === DAYS - 1 ? "bg-text" : "bg-text-muted/35"}`}
              style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }}
            >
              <span className="sr-only">
                {d.day} {d.count}명
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-1.5 flex justify-between text-xs text-text-muted">
          <span>{shortDay(daily[0].day)}</span>
          <span>오늘</span>
        </div>
      </section>
    </>
  );
}

function Head({ id, title, value, href }: { id: string; title: string; value: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className={adminH2}>
        {title} <span className="font-normal text-text-muted tabular-nums">{value}</span>
      </h2>
      <Link href={href} className="inline-flex min-h-11 items-center text-[15px] text-text-muted hover:text-text">
        모두 보기 →
      </Link>
    </div>
  );
}

function shortDay(key: string) {
  const [, m, d] = key.split("-").map(Number);
  return `${m}월 ${d}일`;
}
