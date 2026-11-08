import type { MetadataRoute } from "next";
import { THEME_BG } from "@/lib/theme";

// 홈 화면에 설치할 때 쓰는 정보 (/manifest.webmanifest)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nook",
    short_name: "Nook",
    description: "오늘의 생각을 다시 만나는 곳. 짧게 정리한 생각을 한 달 뒤, 1년 뒤 같은 날에 다시 만나요.",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone", // 주소창 없이 앱처럼 열린다
    // 앱이 켜지는 순간의 바탕색·상단 색. 기기 테마를 미리 알 수 없어 기본(낮) 색을 쓴다.
    background_color: THEME_BG.light,
    theme_color: THEME_BG.light,
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
