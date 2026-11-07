import type { Metadata } from "next";
import { Suspense } from "react";
import { LogoutButton } from "@/components/logout-button";
import { SkeletonBar, SkeletonGroup } from "@/components/skeleton";
import { getAccount } from "@/lib/account";

export const metadata: Metadata = { title: "기다리는 중 · Nook" };

// 가입은 했지만 아직 승인되지 않은 사람이 보는 화면 (17단계).
// 승인되면 proxy가 알아서 홈으로 보낸다. 로그인 안 했거나 이미 승인된 사람은 여기 올 수 없다.
export default function WaitingPage() {
  return (
    <section className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
      <Suspense
        fallback={
          <SkeletonGroup label="계정 상태를 확인하는 중" className="flex flex-col gap-3">
            <SkeletonBar className="h-7 w-48" />
            <SkeletonBar className="h-4 w-full" />
          </SkeletonGroup>
        }
      >
        <WaitingMessage />
      </Suspense>
      <LogoutButton className="mt-10" />
    </section>
  );
}

async function WaitingMessage() {
  const account = await getAccount();
  const rejected = account?.status === "rejected";

  return rejected ? (
    <>
      <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">승인되지 않았어요</h1>
      <p className="mt-3 text-base leading-relaxed text-text-muted">
        지금은 이 계정으로 Nook을 쓸 수 없어요. 잘못된 것 같다면 관리자에게 알려 주세요.
      </p>
    </>
  ) : (
    <>
      <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">승인을 기다리고 있어요</h1>
      <p className="mt-3 text-base leading-relaxed text-text-muted">
        가입해 주셔서 고마워요. Nook은 지금 한 분씩 천천히 맞이하고 있어요.
        <br />
        승인되면 이 화면을 새로 고치거나 다시 열었을 때 바로 시작할 수 있어요.
      </p>
    </>
  );
}
