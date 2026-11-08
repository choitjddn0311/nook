"use client";

import { useRef, useState } from "react";
import { removePostImage, updateImageAlt, uploadPostImage } from "@/app/posts/[id]/image-actions";
import { secondaryButton } from "@/lib/button-styles";
import type { PostImage } from "@/lib/post-images";
import { resizeImage } from "@/lib/resize-image";

const MAX = 10; // 글당 장수 (DB 함수 add_post_image와 같은 값)

type Props = {
  initial: PostImage[];
  // 사진을 붙일 글 id. 새 글이면 먼저 저장해서 만든다. 못 만들면 이유를 돌려준다.
  ensurePost: () => Promise<{ id: string } | { error: string }>;
};

// 편집기의 사진 줄: 사진 추가(여러 장) → 기기에서 줄이고 위치 정보를 지운 뒤 하나씩 올린다.
// 사진마다 빼기(×)와 설명(선택, 화면 낭독기가 읽음)이 있다.
export function ImageAttachments({ initial, ensurePost }: Props) {
  const [images, setImages] = useState(initial);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const left = MAX - images.length - uploading;

  async function addFiles(files: File[]) {
    setError(null);
    if (!navigator.onLine) {
      setError("인터넷이 연결되면 사진을 붙일 수 있어요.");
      return;
    }
    const picked = files.slice(0, Math.max(0, left));
    if (picked.length < files.length) setError(`사진은 글 하나에 ${MAX}장까지 붙일 수 있어요.`);
    if (picked.length === 0) return;

    const post = await ensurePost();
    if ("error" in post) {
      setError(post.error);
      return;
    }

    setUploading((n) => n + picked.length);
    for (const file of picked) {
      try {
        const { blob, width, height } = await resizeImage(file);
        const form = new FormData();
        form.set("postId", post.id);
        form.set("file", new File([blob], blob.type === "image/webp" ? "photo.webp" : "photo.jpg", { type: blob.type }));
        form.set("width", String(width));
        form.set("height", String(height));
        const result = await uploadPostImage(form);
        if (result.ok) setImages((list) => [...list, result.image]);
        else setError(result.error);
      } catch (e) {
        setError(e instanceof Error ? e.message : "사진을 올리지 못했어요.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function remove(image: PostImage) {
    setImages((list) => list.filter((i) => i.id !== image.id));
    const { ok } = await removePostImage(image.id);
    if (!ok) {
      setImages((list) => [...list, image].sort((a, b) => a.position - b.position));
      setError("사진을 빼지 못했어요. 잠시 후 다시 해 주세요.");
    }
  }

  async function saveAlt(image: PostImage, alt: string) {
    if ((image.alt ?? "") === alt.trim()) return;
    const { ok } = await updateImageAlt(image.id, alt);
    if (ok) setImages((list) => list.map((i) => (i.id === image.id ? { ...i, alt: alt.trim() || null } : i)));
    else setError("설명을 저장하지 못했어요.");
  }

  return (
    <section aria-labelledby="images-heading" className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="images-heading" className="text-sm text-text-muted">
          사진 <span className="tabular-nums">{images.length}/{MAX}</span>
        </h2>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = ""; // 같은 사진을 다시 골라도 동작하게
            void addFiles(files);
          }}
        />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={left <= 0} className={secondaryButton}>
          {uploading > 0 ? `올리는 중… ${uploading}` : "사진 추가"}
        </button>
      </div>

      <p role="alert" className="mt-2 text-sm text-text empty:hidden">
        {error}
      </p>

      {(images.length > 0 || uploading > 0) && (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image, i) => (
            <li key={image.id} className="flex flex-col gap-1.5">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element -- 서명 주소(1시간)라 이미지 최적화를 거치지 않는다 */}
                <img src={image.url} alt={image.alt ?? `사진 ${i + 1}`} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => void remove(image)}
                  aria-label={`사진 ${i + 1} 빼기`}
                  className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full bg-bg/80 text-text backdrop-blur-sm transition-transform duration-100 ease-out active:scale-[0.94]"
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4">
                    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <label className="sr-only" htmlFor={`alt-${image.id}`}>
                사진 {i + 1} 설명 (선택)
              </label>
              <input
                id={`alt-${image.id}`}
                type="text"
                maxLength={200}
                defaultValue={image.alt ?? ""}
                placeholder="설명 (선택)"
                onBlur={(e) => void saveAlt(image, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) e.currentTarget.blur();
                }}
                className="w-full border-b border-text-muted bg-transparent py-1 text-base text-text placeholder:text-text-muted focus:border-b-2 focus:border-text focus-visible:outline-none"
              />
            </li>
          ))}
          {Array.from({ length: uploading }, (_, i) => (
            <li key={`uploading-${i}`} aria-hidden="true" className="aspect-square animate-pulse rounded-lg bg-surface motion-reduce:animate-none" />
          ))}
        </ul>
      )}
    </section>
  );
}
