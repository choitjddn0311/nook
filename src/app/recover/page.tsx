import type { Metadata } from "next";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = { title: "비밀번호 다시 정하기 · Nook" };

export default function RecoverPage() {
  return (
    <section className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
      <RecoverForm />
    </section>
  );
}
