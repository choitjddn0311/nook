import type { Metadata, Viewport } from "next";
// Pretendard: 한글을 필요한 글자 묶음만 내려받는 '동적 서브셋' 버전. 폰트 파일을 앱이 직접 들고 있어 오프라인에서도 쓸 수 있다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { THEME_BG, themeInitScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Nook",
  description: "오늘의 생각을 다시 만나는 곳, Nook.",
  applicationName: "Nook",
  // 아이폰 '홈 화면에 추가' 시 앱처럼(주소창 없이) 열리게
  appleWebApp: { capable: true, title: "Nook", statusBarStyle: "default" },
  // 전화번호처럼 보이는 숫자를 자동으로 링크로 바꾸지 않게 (일기 본문 보호)
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 노치·홈 인디케이터 아래까지 화면을 쓰고, 내용은 env(safe-area-inset-*)로 비켜 둔다
  viewportFit: "cover",
  // 안드로이드에서 키보드가 올라오면 화면 높이를 줄여 하단 저장 버튼이 키보드 위에 오게
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_BG.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_BG.dark },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme은 아래 스크립트가 그리기 전에 붙이므로 서버 HTML과 다를 수 있다 → 경고 억제
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
