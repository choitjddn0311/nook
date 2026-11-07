"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "@/app/me/actions";
import { secondaryButton } from "@/lib/button-styles";
import { fieldClass, labelClass } from "@/lib/form-styles";

const initial: PasswordState = { error: null, done: false };

// 평소에는 접어 두고 필요할 때 펼친다 (네이티브 <details>)
export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initial);

  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-base text-text [&::-webkit-details-marker]:hidden">
        비밀번호 바꾸기
        <span aria-hidden="true" className="text-text-muted transition-transform duration-100 group-open:rotate-90">
          ›
        </span>
      </summary>
      <form action={action} className="flex flex-col gap-4 pt-2 pb-4" noValidate>
        {[
          ["current", "현재 비밀번호", "current-password"],
          ["next", "새 비밀번호 (8자 이상)", "new-password"],
          ["confirm", "새 비밀번호 확인", "new-password"],
        ].map(([name, label, autoComplete]) => (
          <div key={name} className="flex flex-col gap-2">
            <label htmlFor={`password-${name}`} className={labelClass}>
              {label}
            </label>
            <input id={`password-${name}`} name={name} type="password" autoComplete={autoComplete} required className={fieldClass} />
          </div>
        ))}
        <p role="status" className="text-sm font-medium text-text empty:hidden">
          {state.error ?? (state.done ? "비밀번호를 바꿨어요. 다른 기기는 곧 로그아웃돼요." : "")}
        </p>
        <button type="submit" disabled={pending} className={`${secondaryButton} self-start`}>
          {pending ? "바꾸는 중…" : "비밀번호 바꾸기"}
        </button>
      </form>
    </details>
  );
}
