"use client";

import Link from "next/link";
import { useActionState } from "react";
import { RecoveryCodeNotice } from "@/components/recovery-code-notice";
import { primaryButton } from "@/lib/button-styles";
import { fieldClass, labelClass } from "@/lib/form-styles";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = { error: null, username: "", code: null };

export function SignupForm({ socialButtons }: { socialButtons: React.ReactNode }) {
  const [state, formAction, pending] = useActionState(signup, initialState);

  // 가입 완료: 복구 코드를 보여 주고 나서 승인 대기 화면으로
  if (state.code) return <RecoveryCodeNotice code={state.code} nextHref="/waiting" nextLabel="다음으로" />;

  const invalid = state.error ? true : undefined;
  const describedBy = state.error ? "signup-error" : undefined;

  return (
    <>
      <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">가입하기</h1>
      <p className="mt-2 mb-8 text-base leading-relaxed text-text-muted">Google로, 또는 이메일 없이 아이디로 가입해요.</p>

      {socialButtons}
      <form action={formAction} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="username" className={labelClass}>
            아이디
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            defaultValue={state.username}
            aria-invalid={invalid}
            aria-describedby={["username-hint", describedBy].filter(Boolean).join(" ")}
            className={fieldClass}
          />
          <p id="username-hint" className="text-sm text-text-muted">
            영문 소문자, 숫자, _ 로 4~20자. 나중에 바꿀 수 없어요.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className={labelClass}>
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={invalid}
            aria-describedby={["password-hint", describedBy].filter(Boolean).join(" ")}
            className={fieldClass}
          />
          <p id="password-hint" className="text-sm text-text-muted">
            8자 이상
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirm" className={labelClass}>
            비밀번호 확인
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={fieldClass}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-relaxed text-text">
          <input type="checkbox" name="agree" required className="mt-1 size-5 shrink-0 accent-(--accent)" />
          <span>
            만 14세 이상이며,{" "}
            <a href="/terms" target="_blank" rel="noopener" className="underline underline-offset-4">
              이용약관
            </a>
            에 동의하고{" "}
            <a href="/privacy" target="_blank" rel="noopener" className="underline underline-offset-4">
              개인정보 처리방침
            </a>
            (국외 이전 포함)을 확인했어요. (필수)
          </span>
        </label>

        <p id="signup-error" role="alert" className="min-h-6 text-sm font-medium text-text">
          {state.error}
        </p>

        <button type="submit" disabled={pending} className={`${primaryButton} w-full`}>
          {pending ? "가입하는 중…" : "가입하기"}
        </button>
      </form>

      <p className="mt-6 text-[15px] text-text-muted">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="text-text underline underline-offset-4">
          로그인
        </Link>
      </p>
    </>
  );
}
