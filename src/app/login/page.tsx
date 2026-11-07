import type { Metadata } from "next";
import { Suspense } from "react";
import { SocialLoginButtons } from "@/components/social-login-buttons";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인 · Nook" };

const OAUTH_ERRORS: Record<string, string> = {
  signup_disabled: "지금은 가입 준비 중이에요. 조금만 기다려 주세요.",
  oauth: "로그인하지 못했어요. 다시 해 주세요.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <section className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
      <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">로그인</h1>
      <p className="mt-2 mb-8 text-base leading-relaxed text-text-muted">다시 오셨네요. 쓰던 곳에서 이어 가요.</p>
      {/* 소셜 로그인에서 돌아왔을 때의 오류 (주소 값은 요청 때만 알 수 있어 Suspense 안에서 읽는다) */}
      <Suspense fallback={null}>
        {searchParams.then(({ error }) => {
          const message = typeof error === "string" ? OAUTH_ERRORS[error] : undefined;
          return message ? (
            <p role="alert" className="mb-4 text-sm font-medium text-text">
              {message}
            </p>
          ) : null;
        })}
      </Suspense>
      <SocialLoginButtons />
      <LoginForm />
    </section>
  );
}
