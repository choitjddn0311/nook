import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminTitle } from "@/components/admin-ui";
import { ChangePasswordForm } from "@/components/change-password-form";
import { LegalLinks } from "@/components/legal-document";
import { LogoutButton } from "@/components/logout-button";
import { RegenerateRecoveryCode } from "@/components/regenerate-recovery-code";
import { getAccount } from "@/lib/account";

export const metadata: Metadata = { title: "내 계정 · 관리 · Nook" };

// 관리자 계정은 /me 없이 여기서 비밀번호·복구 코드·로그아웃을 한다
export default function AdminMePage() {
  return (
    <>
      <AdminTitle>내 계정</AdminTitle>
      <Suspense fallback={null}>
        <MyAccount />
      </Suspense>
    </>
  );
}

async function MyAccount() {
  const account = await getAccount();
  if (!account?.isAdmin) notFound();
  return (
    <section className="max-w-xl lg:mt-4">
      {account.hasPassword && (
        <div className="divide-y divide-border">
          <ChangePasswordForm />
          <div className="py-2">
            <p className="text-[15px] leading-relaxed text-text-muted">
              비밀번호를 잊었을 때 쓰는 코드예요. 새로 만들면 이전 코드는 쓸 수 없어요.
            </p>
            <RegenerateRecoveryCode className="mt-1" />
          </div>
        </div>
      )}
      <LogoutButton className="mt-8 border-t border-border pt-4" />
      <LegalLinks className="mt-2" />
    </section>
  );
}
