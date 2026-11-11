import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountList } from "@/components/account-list";
import { ChangePasswordForm } from "@/components/change-password-form";
import { InquiryRow } from "@/components/inquiry-row";
import { LegalLinks } from "@/components/legal-document";
import { LogoutButton } from "@/components/logout-button";
import { RegenerateRecoveryCode } from "@/components/regenerate-recovery-code";
import { SignupRow } from "@/components/signup-row";
import { SkeletonBar, SkeletonGroup } from "@/components/skeleton";
import { getAccount } from "@/lib/account";
import { getInquiriesForAdmin, getSignupsForAdmin } from "@/lib/admin";
import { seoulDayKey } from "@/lib/stats";

export const metadata: Metadata = { title: "관리 · Nook" };

// 관리자 대시보드: 승인 대기 → 문의 → 현황 → 계정 목록 → 내 계정을 한 화면에. 관리자 계정은 이 화면만 쓴다.
// 관리자도 다른 사람의 글은 볼 수 없다. 계정 정보와 글 개수만 다룬다.
export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col pt-4 pb-10">
      <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">관리</h1>
      <Suspense fallback={<AdminSkeleton />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

const h2Class = "text-lg leading-snug font-semibold tracking-[-0.01em] text-text";

async function Dashboard() {
  const { all, others } = await getSignupsForAdmin(); // 관리자가 아니면 여기서 404
  const inquiries = await getInquiriesForAdmin();
  const account = await getAccount(); // 위에서 이미 읽어 둔 값(cache)
  const unanswered = inquiries.filter((i) => i.answered_at === null).length;
  const waiting = others.filter((s) => s.status === "pending").sort((a, b) => a.created_at.localeCompare(b.created_at));
  const today = seoulDayKey(new Date());
  const stats: [string, string][] = [
    ["전체 계정", `${all.length.toLocaleString("ko-KR")}명`],
    ["오늘 가입", `${all.filter((s) => seoulDayKey(new Date(s.created_at)) === today).length.toLocaleString("ko-KR")}명`],
    ["전체 글", `${all.reduce((sum, s) => sum + s.post_count, 0).toLocaleString("ko-KR")}개`],
    ["전체 사진", `${all.reduce((sum, s) => sum + s.image_count, 0).toLocaleString("ko-KR")}장`],
  ];

  return (
    <>
      <section aria-labelledby="admin-waiting" className="mt-6">
        <h2 id="admin-waiting" className={h2Class}>
          승인 대기 <span className="font-normal text-text-muted tabular-nums">{waiting.length}명</span>
        </h2>
        {waiting.length === 0 ? (
          <p className="mt-3 text-[15px] text-text-muted">기다리는 신청이 없어요.</p>
        ) : (
          <ul className="mt-1 divide-y divide-border">
            {waiting.map((s) => (
              <SignupRow key={s.id} signup={s} variant="pending" />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="admin-inquiries" className="mt-10">
        <h2 id="admin-inquiries" className={h2Class}>
          문의 <span className="font-normal text-text-muted tabular-nums">{unanswered}건 답장 전</span>
        </h2>
        {inquiries.length === 0 ? (
          <p className="mt-3 text-[15px] text-text-muted">받은 문의가 없어요.</p>
        ) : (
          <ul className="mt-1 divide-y divide-border">
            {inquiries.map((i) => (
              <InquiryRow key={i.id} inquiry={i} />
            ))}
          </ul>
        )}
        <p className="mt-2 text-sm text-text-muted">답장한 문의는 1년 뒤 자동으로 지워져요.</p>
      </section>

      <section aria-labelledby="admin-stats" className="mt-10">
        <h2 id="admin-stats" className={h2Class}>
          현황
        </h2>
        <dl className="mt-1 divide-y divide-border">
          {stats.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-[15px] text-text-muted">{label}</dt>
              <dd className="text-xl font-semibold tracking-[-0.01em] text-text tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-sm text-text-muted">글과 사진은 개수만 보여요. 관리 화면에서는 글 내용과 사진을 볼 수 없어요.</p>
      </section>

      <section aria-labelledby="admin-accounts" className="mt-10">
        <h2 id="admin-accounts" className={h2Class}>
          계정
        </h2>
        <AccountList accounts={others.filter((s) => s.status !== "pending")} />
      </section>

      {/* 관리자 계정은 /me 없이 이 화면에서 내 계정까지 관리한다 */}
      <section aria-labelledby="admin-me" className="mt-12">
        <h2 id="admin-me" className={h2Class}>
          내 계정
        </h2>
        {account?.hasPassword && (
          <div className="mt-2 divide-y divide-border">
            <ChangePasswordForm />
            <div className="py-2">
              <p className="text-[15px] leading-relaxed text-text-muted">
                비밀번호를 잊었을 때 쓰는 코드예요. 새로 만들면 이전 코드는 쓸 수 없어요.
              </p>
              <RegenerateRecoveryCode className="mt-1" />
            </div>
          </div>
        )}
        <LogoutButton className="mt-6 border-t border-border pt-4" />
        <LegalLinks className="mt-2" />
      </section>
    </>
  );
}

function AdminSkeleton() {
  return (
    <SkeletonGroup label="관리 정보를 불러오는 중" className="mt-6 flex flex-col gap-3">
      <SkeletonBar className="h-6 w-32" />
      <SkeletonBar className="h-12 w-full" />
      <SkeletonBar className="mt-6 h-10 w-full" />
      <SkeletonBar className="h-10 w-full" />
    </SkeletonGroup>
  );
}
