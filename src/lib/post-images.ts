import "server-only";
import { isPostId } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export const IMAGE_BUCKET = "post-images";
export const IMAGES_PER_POST = 10; // DB 함수 add_post_image와 같은 값
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 버킷 file_size_limit과 같은 값
const SIGNED_URL_SECONDS = 60 * 60; // 화면에 보여 줄 주소는 1시간만 열린다

export type PostImage = { id: string; url: string; width: number; height: number; alt: string | null; position: number };

// 글의 사진들 (순서대로) + 1시간짜리 서명 주소. RLS 때문에 내 사진만 온다.
export async function getPostImages(postId: string): Promise<PostImage[]> {
  if (!isPostId(postId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_images")
    .select("id, path, width, height, alt, position")
    .eq("post_id", postId)
    .order("position");
  if (error || !data || data.length === 0) return [];

  const { data: signed } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(
    data.map((row) => row.path),
    SIGNED_URL_SECONDS,
  );
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return data.flatMap((row) => {
    const url = urlByPath.get(row.path);
    return url ? [{ id: row.id, url, width: row.width, height: row.height, alt: row.alt, position: row.position }] : [];
  });
}

// 글 목록에 '사진 n'을 붙이려고 글마다 사진 수를 센다
export async function countImagesByPost(postIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (postIds.length === 0) return counts;
  const supabase = await createClient();
  const { data } = await supabase.from("post_images").select("post_id").in("post_id", postIds);
  for (const row of data ?? []) counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
  return counts;
}

// 파일 지우기 (글 삭제·탈퇴 때). 실패해도 매일 정리 함수가 다시 지운다.
export async function removeImageFiles(paths: string[]) {
  if (paths.length === 0) return;
  const supabase = await createClient();
  for (let i = 0; i < paths.length; i += 100) {
    await supabase.storage.from(IMAGE_BUCKET).remove(paths.slice(i, i + 100));
  }
}
