import { NextResponse, type NextRequest } from "next/server";
import { toMarkdown, type ExportNote, type ExportPost } from "@/lib/export";
import { seoulDayKey } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

const PAGE = 1000; // Supabase가 한 번에 주는 최대 행 수. 글이 많아도 전부 받도록 나눠서 읽는다.

// 내 글 내보내기. RLS 덕분에 로그인한 본인의 글만 나온다.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "md";

  const posts: ExportPost[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, content, tags, format, is_favorite, created_at, updated_at")
      .order("created_at", { ascending: true })
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) return new NextResponse("글을 불러오지 못했어요.", { status: 500 });
    posts.push(...data);
    if (data.length < PAGE) break;
  }

  const notes: ExportNote[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("post_notes")
      .select("post_id, content, created_at")
      .order("created_at", { ascending: true })
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) return new NextResponse("글을 불러오지 못했어요.", { status: 500 });
    notes.push(...data);
    if (data.length < PAGE) break;
  }

  const fileName = `nook-export-${seoulDayKey(new Date())}.${format}`;
  const body = format === "json" ? JSON.stringify({ posts, notes }, null, 2) : toMarkdown(posts, notes);
  return new NextResponse(body, {
    headers: {
      "Content-Type": format === "json" ? "application/json; charset=utf-8" : "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
