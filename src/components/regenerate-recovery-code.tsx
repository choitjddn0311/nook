"use client";

import { useActionState } from "react";
import { regenerateRecoveryCode, type RegenerateState } from "@/app/auth-actions";
import { quietButton } from "@/lib/button-styles";

// 복구 코드 다시 만들기. 만들면 이전 코드는 바로 무효가 되므로 새 코드를 그 자리에서 보여 준다.
export function RegenerateRecoveryCode({ className = "" }: { className?: string }) {
  const [state, action, pending] = useActionState<RegenerateState, FormData>(regenerateRecoveryCode, {
    code: null,
    error: null,
  });

  return (
    <div className={className}>
      {state.code ? (
        <>
          <p className="text-[15px] leading-relaxed text-text-muted">
            새 복구 코드예요. 지금만 볼 수 있고, 이전 코드는 더 이상 쓸 수 없어요.
          </p>
          <p className="mt-2 rounded-lg bg-surface px-4 py-3 text-center font-semibold tracking-wide break-all text-text tabular-nums select-all">
            {state.code}
          </p>
        </>
      ) : (
        <form action={action}>
          <button type="submit" disabled={pending} className={`${quietButton} -ml-3`}>
            {pending ? "만드는 중…" : "복구 코드 다시 만들기"}
          </button>
          <p role="alert" className="text-sm font-medium text-text">
            {state.error}
          </p>
        </form>
      )}
    </div>
  );
}
