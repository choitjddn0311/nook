import { seoulDayKey } from "@/lib/stats";

// 내 글 내보내기 형식 (20단계). 순수 함수라 서버 어디서나 같게 돈다.
export type ExportPost = {
  id: string;
  title: string | null;
  content: string;
  tags: string[];
  format: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};
export type ExportNote = { post_id: string; content: string; created_at: string };

// 글과 덧붙인 생각을 날짜순으로 읽을 수 있게 한 파일에 모은다
export function toMarkdown(posts: ExportPost[], notes: ExportNote[]) {
  const notesByPost = new Map<string, ExportNote[]>();
  for (const note of notes) notesByPost.set(note.post_id, [...(notesByPost.get(note.post_id) ?? []), note]);

  const parts = posts.map((post) => {
    const day = seoulDayKey(new Date(post.created_at));
    const lines = [`# ${post.title?.trim() || day}`, "", `날짜: ${day}`];
    if (post.tags.length) lines.push(`태그: ${post.tags.map((t) => `#${t}`).join(" ")}`);
    if (post.is_favorite) lines.push("즐겨찾기: 예");
    lines.push("", post.content);
    for (const note of notesByPost.get(post.id) ?? []) {
      lines.push("", `## ${seoulDayKey(new Date(note.created_at))}에 덧붙인 생각`, "", note.content);
    }
    return lines.join("\n");
  });
  return parts.join("\n\n---\n\n") + "\n";
}
