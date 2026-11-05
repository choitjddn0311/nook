import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16의 proxy (예전 이름: middleware). 페이지를 그리기 전에 로그인 상태를 확인한다.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // 정적 파일(_next/static, 이미지, 폰트, 아이콘 등)은 로그인 확인 없이 통과시킨다.
  // 확장자가 있는 경로를 모두 제외해서 CSS·JS·폰트가 /login 으로 튕기는 일이 없게 한다.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
