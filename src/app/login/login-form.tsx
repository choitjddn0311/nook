"use client";

import Link from "next/link";
import { useActionState } from "react";
import { primaryButton } from "@/lib/button-styles";
import { fieldClass, labelClass } from "@/lib/form-styles";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: null, login: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="login" className={labelClass}>
          아이디 또는 이메일
        </label>
        <input
          id="login"
          name="login"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.login}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={labelClass}>
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
          className={fieldClass}
        />
      </div>

      {/* 오류 문구 자리. 화면 낭독기가 바로 읽도록 role="alert" */}
      <p id="login-error" role="alert" className="min-h-6 text-sm font-medium text-text">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className={`${primaryButton} w-full`}
      >
        {pending ? "로그인하는 중…" : "로그인"}
      </button>

      <div className="flex items-center justify-between text-[15px]">
        <Link href="/signup" className="inline-flex min-h-11 items-center text-text underline underline-offset-4">
          가입하기
        </Link>
        <Link href="/recover" className="inline-flex min-h-11 items-center text-text-muted hover:text-text">
          비밀번호를 잊었어요
        </Link>
      </div>
    </form>
  );
}
