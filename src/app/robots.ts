import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /robots.txt: 공개 화면만 둘러보게 하고, 로그인 뒤 화면은 들어오지 않게 한다.
// 로그인·가입·복구 화면은 막지 않는다: 들어와서 noindex를 읽어야 검색 결과에서 빠진다(Google 권장 방식).
// (들어와도 로그인 화면으로 돌아갈 뿐이지만, 검색 결과에 주소가 남지 않게 막는다)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/posts", "/write", "/me", "/past", "/random", "/admin", "/waiting", "/auth"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
