"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null, email: "" };

const fieldClass =
  "h-12 w-full rounded-lg bg-surface px-4 text-base text-text placeholder:text-text-muted outline-offset-2 transition-colors";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-text">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.email}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-text">
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
        className="h-12 w-full rounded-lg bg-accent text-base font-semibold text-accent-contrast transition-[transform,opacity] duration-100 ease-out active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "로그인하는 중…" : "로그인"}
      </button>
    </form>
  );
}
