import { NextResponse, type NextRequest } from "next/server";
import { fetchAll } from "@/lib/fetch-all";
import { toMarkdown, type ExportImage, type ExportNote, type ExportPost } from "@/lib/export";
import { seoulDayKey } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

// 내 글 내보내기. RLS 덕분에 로그인한 본인의 글만 나온다.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "md";

  // 글이 많아도 전부 받도록 1000개씩 나눠서 읽는다
  const [posts, notes, images] = await Promise.all([
    fetchAll<ExportPost>((from, to) =>
      supabase
        .from("posts")
        .select("id, title, content, tags, format, is_favorite, created_at, updated_at")
        .order("created_at", { ascending: true })
        .order("id")
        .range(from, to),
    ),
    fetchAll<ExportNote>((from, to) =>
      supabase
        .from("post_notes")
        .select("post_id, content, created_at")
        .order("created_at", { ascending: true })
        .order("id")
        .range(from, to),
    ),
    fetchAll<ExportImage>((from, to) =>
      supabase
        .from("post_images")
        .select("post_id, alt, width, height, position, created_at")
        .order("post_id")
        .order("position")
        .range(from, to),
    ),
  ]);
  if (!posts || !notes || !images) return new NextResponse("글을 불러오지 못했어요.", { status: 500 });

  const fileName = `nook-export-${seoulDayKey(new Date())}.${format}`;
  const body = format === "json" ? JSON.stringify({ posts, notes, images }, null, 2) : toMarkdown(posts, notes, images);
  return new NextResponse(body, {
    headers: {
      "Content-Type": format === "json" ? "application/json; charset=utf-8" : "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
