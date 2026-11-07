import type { Metadata } from "next";
import { SocialLoginButtons } from "@/components/social-login-buttons";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "가입하기 · Nook" };

export default function SignupPage() {
  return (
    <section className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
      <SignupForm socialButtons={<SocialLoginButtons />} />
    </section>
  );
}
