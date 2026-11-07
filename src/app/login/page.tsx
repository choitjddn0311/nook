import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인 · Nook" };

export default function LoginPage() {
  return (
    <section className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
      <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">로그인</h1>
      <p className="mt-2 mb-8 text-base leading-relaxed text-text-muted">다시 오셨네요. 쓰던 곳에서 이어 가요.</p>
      <LoginForm />
    </section>
  );
}
