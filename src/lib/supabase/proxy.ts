import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// 로그인하지 않아도 열 수 있는 경로
const PUBLIC_PATHS = ["/login", "/signup", "/recover", "/welcome", "/auth"];
// 누구나 언제든 읽을 수 있는 문서 (로그인·승인 여부와 상관없이)
const DOCUMENT_PATHS = ["/privacy", "/terms", "/contact/sent"];
// 승인 전(가입 신청 중·거절됨)인 사람이 보는 화면
const WAITING_PATH = "/waiting";

// 모든 요청 전에 실행된다 (src/proxy.ts).
// 1) 로그인 토큰이 만료돼 가면 새로 발급해서 쿠키에 다시 쓴다 → 로그인이 계속 유지된다.
// 2) 로그인 안 한 사람이 / 에 오면 주소는 그대로 두고 소개 화면(/welcome)을 보여 준다. 다른 화면에 오면 / 로 보낸다.
//    이미 로그인한 사람이 로그인·가입 화면에 오면 / 로 보낸다.
// 3) 로그인했지만 아직 승인되지 않은 사람은 /waiting 으로 보낸다 (17단계 승인 제도).
//    여기서는 화면 안내만 한다. 진짜 잠금은 DB의 RLS('승인된 사용자만')가 한다.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // 토큰이 갱신된 응답이 CDN에 캐시돼 다른 사람에게 가지 않도록 캐시 금지 헤더도 함께 붙인다.
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // 주의(Supabase 공식 안내): createServerClient 와 getClaims 사이에 다른 코드를 넣지 않는다.
  // getClaims 는 토큰 서명을 검사해서 진짜 로그인인지 확인한다.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  if (DOCUMENT_PATHS.includes(pathname)) return response;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!isLoggedIn && pathname === "/") return rewriteKeepingCookies(request, response, "/welcome");
  if (!isLoggedIn && !isPublic) return redirectKeepingCookies(request, response, "/");
  if (isLoggedIn && isPublic) return redirectKeepingCookies(request, response, "/");

  if (isLoggedIn) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", String(data?.claims?.sub))
      .maybeSingle();
    // 프로필을 읽지 못한 경우(일시적 오류)는 그대로 보낸다. 데이터는 RLS가 막는다.
    const approved = error ? true : profile?.status === "approved";
    const onWaiting = pathname === WAITING_PATH;
    if (!approved && !onWaiting) return redirectKeepingCookies(request, response, WAITING_PATH);
    if (approved && onWaiting) return redirectKeepingCookies(request, response, "/");
  }

  return response;
}

// 주소창은 그대로 두고 다른 화면을 보여 줄 때도 쿠키·헤더를 옮겨 담는다.
function rewriteKeepingCookies(request: NextRequest, from: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const rewrite = NextResponse.rewrite(url);
  copyAuthState(from, rewrite);
  return rewrite;
}

// 다른 주소로 보낼 때도 방금 갱신한 쿠키·헤더를 옮겨 담아야 로그인이 풀리지 않는다.
function redirectKeepingCookies(request: NextRequest, from: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  copyAuthState(from, redirect);
  return redirect;
}

function copyAuthState(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) to.headers.set(header, value);
  }
}
