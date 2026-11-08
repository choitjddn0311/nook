import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, SITE_URL } from "@/lib/site";

// /sitemap.xml: 검색 엔진에 알릴 공개 화면 목록
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((path) => ({ url: `${SITE_URL}${path === "/" ? "" : path}` }));
}
