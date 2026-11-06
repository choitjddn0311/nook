import { NextResponse, type NextRequest } from "next/server";
import { isPostId } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

// 15단계 '랜덤 생각': 내 글 중 하나를 무작위로 골라 그 글 보기 화면으로 보낸다.
// /random            → 아무 글이나
// /random?except=<id> → 방금 본 글은 빼고 (다른 글 버튼)
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const except = url.searchParams.get("except");
  const supabase = await createClient();

  // 몇 편 중에서 고를지 (RLS 때문에 내 글만 센다)
  let countQuery = supabase.from("posts").select("id", { count: "exact", head: true });
  if (except && isPostId(except)) countQuery = countQuery.neq("id", except);
  const { count } = await countQuery;

  // 고를 글이 없을 때: 글이 아예 없으면 홈, 방금 본 글 하나뿐이면 그 글로 돌아가 '다른 글이 아직 없어요' 안내
  if (!count) {
    if (except && isPostId(except)) return redirectTo(url, `/posts/${except}`, "only");
    return redirectTo(url, "/");
  }

  const pick = Math.floor(Math.random() * count);
  let pickQuery = supabase.from("posts").select("id").order("created_at", { ascending: true }).range(pick, pick);
  if (except && isPostId(except)) pickQuery = pickQuery.neq("id", except);
  const { data } = await pickQuery;
  const id = data?.[0]?.id;
  if (!id) return redirectTo(url, "/");

  return redirectTo(url, `/posts/${id}`, "random");
}

function redirectTo(base: URL, pathname: string, from?: "random" | "only") {
  const target = new URL(pathname, base);
  if (from) target.searchParams.set("from", from);
  // 매번 다른 글이어야 하므로 캐시 금지
  const res = NextResponse.redirect(target, 303);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
