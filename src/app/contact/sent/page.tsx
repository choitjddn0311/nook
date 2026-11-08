import type { Metadata } from "next";
import Link from "next/link";
import { secondaryButton } from "@/lib/button-styles";

export const metadata: Metadata = { title: "문의를 보냈어요 · Nook" };

// 문의 보내기 완료 (감사 페이지). 로그인 여부와 상관없이 열린다.
export default function ContactSentPage() {
  return (
    <div className="flex flex-1 flex-col justify-center py-16">
      <h1 className="text-3xl leading-tight font-semibold tracking-[-0.02em] text-balance text-text sm:text-4xl">
        문의를 잘 받았어요.
        <br />
        고맙습니다.
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-text-muted sm:text-lg">
        24시간 안에 남겨 주신 이메일로 답장할게요. 메일이 보이지 않으면 스팸함도 한번 살펴봐 주세요.
      </p>
      <div className="mt-8">
        <Link href="/" className={secondaryButton}>
          처음으로
        </Link>
      </div>
    </div>
  );
}
