import type { Metadata, Viewport } from "next";
import { Noto_Serif_KR } from "next/font/google";
// Pretendard: 한글을 필요한 글자 묶음만 내려받는 '동적 서브셋' 버전. 폰트 파일을 앱이 직접 들고 있어 오프라인에서도 쓸 수 있다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { THEME_BG, themeInitScript } from "@/lib/theme";

// 본문용 명조체. 한글 폰트는 용량이 커서 미리 받지 않고(preload: false) 필요한 글자 묶음만 받는다.
const notoSerifKr = Noto_Serif_KR({
  weight: ["400", "600"],
  preload: false,
  display: "swap",
  variable: "--font-noto-serif-kr",
});

export const metadata: Metadata = {
  title: "Nook",
  description: "나만의 작은 구석",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_BG.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_BG.dark },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme은 아래 스크립트가 그리기 전에 붙이므로 서버 HTML과 다를 수 있다 → 경고 억제
    <html lang="ko" className={`${notoSerifKr.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-24 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
