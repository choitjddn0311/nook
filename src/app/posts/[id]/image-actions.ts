"use server";

import { IMAGE_BUCKET, IMAGE_MAX_BYTES, type PostImage } from "@/lib/post-images";
import { isPostId } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export type UploadResult = { ok: true; image: PostImage } | { ok: false; error: string };

// 파일의 첫 바이트로 진짜 WebP·JPEG인지 확인한다 (확장자·형식 이름은 믿지 않는다)
function sniffImage(bytes: Uint8Array): "webp" | "jpg" | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  return null;
}

function size(value: FormDataEntryValue | null) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 4096 ? n : null;
}

// 사진 붙이기: 기기에서 줄인 사진(WebP·JPEG, 2MB 이하)을 받아 Storage에 올리고 정보를 남긴다.
// 내 글인지, 장수 제한은 DB 함수 add_post_image가 확인한다. 실패하면 올린 파일을 지운다.
export async function uploadPostImage(formData: FormData): Promise<UploadResult> {
  const postId = String(formData.get("postId") ?? "");
  const file = formData.get("file");
  const width = size(formData.get("width"));
  const height = size(formData.get("height"));
  if (!isPostId(postId)) return { ok: false, error: "글을 먼저 저장해 주세요." };
  if (!(file instanceof File) || !width || !height) return { ok: false, error: "사진을 읽지 못했어요." };
  if (file.size > IMAGE_MAX_BYTES) return { ok: false, error: "사진이 너무 커요. 2MB까지 올릴 수 있어요." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return { ok: false, error: "사진 파일이 아니에요." };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") return { ok: false, error: "다시 로그인해 주세요." };

  const path = `${userId}/${postId}/${crypto.randomUUID()}.${kind}`;
  const contentType = kind === "webp" ? "image/webp" : "image/jpeg";
  const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(path, bytes, { contentType, upsert: false });
  if (uploadError) return { ok: false, error: "사진을 올리지 못했어요. 잠시 후 다시 해 주세요." };

  const { data: id, error } = await supabase.rpc("add_post_image", { p_post_id: postId, p_path: path, p_width: width, p_height: height });
  if (error || !id) {
    await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    if (error?.code === "P0413") return { ok: false, error: error.message };
    return { ok: false, error: "사진을 붙이지 못했어요. 잠시 후 다시 해 주세요." };
  }

  const { data: signed } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrl(path, 60 * 60);
  const { data: row } = await supabase.from("post_images").select("position").eq("id", id).single();
  return { ok: true, image: { id, url: signed?.signedUrl ?? "", width, height, alt: null, position: row?.position ?? 0 } };
}

// 사진 빼기: 정보를 지운 뒤 파일을 지운다 (파일 삭제가 실패해도 매일 정리 함수가 지운다)
export async function removePostImage(imageId: string): Promise<{ ok: boolean }> {
  if (!isPostId(imageId)) return { ok: false };
  const supabase = await createClient();
  const { data } = await supabase.from("post_images").delete().eq("id", imageId).select("path");
  if (!data || data.length === 0) return { ok: false };
  await supabase.storage.from(IMAGE_BUCKET).remove(data.map((r) => r.path));
  return { ok: true };
}

// 사진 설명 (선택, 200자). 비우면 null
export async function updateImageAlt(imageId: string, alt: unknown): Promise<{ ok: boolean }> {
  if (!isPostId(imageId)) return { ok: false };
  const text = typeof alt === "string" ? alt.trim().slice(0, 200) : "";
  const supabase = await createClient();
  const { data } = await supabase.from("post_images").update({ alt: text || null }).eq("id", imageId).select("id");
  return { ok: Boolean(data && data.length > 0) };
}
