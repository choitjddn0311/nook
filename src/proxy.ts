import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16의 proxy (예전 이름: middleware). 페이지를 그리기 전에 로그인 상태를 확인한다.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // 정적 파일(_next/static, 이미지, 폰트 등)은 로그인 확인 없이 통과시킨다.
  // 확장자가 있는 경로(manifest.webmanifest 포함)와 앱 아이콘(/icon/..., /apple-icon)도 제외한다.
  // → 홈 화면에 설치할 때 브라우저가 로그인 없이 아이콘·매니페스트를 받아 갈 수 있어야 한다.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.[a-zA-Z0-9]+$).*)"],
};
