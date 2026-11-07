import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 소셜 로그인에서 돌아오는 곳. 받은 code를 로그인 세션으로 바꾼다.
// 처음 온 사람은 DB 트리거가 '승인 대기' 프로필을 만들어 두었으므로 /waiting으로 간다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const go = (path: string) => NextResponse.redirect(`${origin}${path}`);

  // 가입이 꺼져 있을 때 처음 온 사람은 code 없이 오류와 함께 돌아온다
  if (searchParams.get("error_code") === "signup_disabled") return go("/login?error=signup_disabled");

  const code = searchParams.get("code");
  if (!code) return go("/login?error=oauth");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return go("/login?error=oauth");

  const { data: profile } = await supabase.from("profiles").select("status").eq("id", data.user.id).maybeSingle();
  return go(profile?.status === "approved" ? "/" : "/waiting");
}
