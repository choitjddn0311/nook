import type { Metadata, Viewport } from "next";
// Pretendard: 한글을 필요한 글자 묶음만 내려받는 '동적 서브셋' 버전. 폰트 파일을 앱이 직접 들고 있어 오프라인에서도 쓸 수 있다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SEARCH_VERIFICATION, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";
import { THEME_BG, themeInitScript } from "@/lib/theme";

const OG_IMAGE_ALT = "오늘의 생각을 다시 만나는 곳, Nook. 오른쪽에 Nook 홈 화면.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Nook",
  description: SITE_TITLE,
  applicationName: "Nook",
  // 링크를 보낼 때 뜨는 미리보기. 어느 주소를 보내든 랜딩 소개가 뜬다(글 내용은 절대 넣지 않는다).
  // 공유 이미지는 정적 파일(public/og.png): 확장자가 있어 proxy의 로그인 확인을 거치지 않는다.
  openGraph: {
    type: "website",
    siteName: "Nook",
    locale: "ko_KR",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION, images: [{ url: "/og.png", alt: OG_IMAGE_ALT }] },
  // 기본은 검색에서 뺀다. 공개 화면(랜딩, 처리방침, 약관)만 각 페이지에서 허용한다.
  robots: { index: false, follow: false },
  verification: {
    ...(SEARCH_VERIFICATION.google && { google: SEARCH_VERIFICATION.google }),
    ...(SEARCH_VERIFICATION.naver && { other: { "naver-site-verification": SEARCH_VERIFICATION.naver } }),
  },
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
