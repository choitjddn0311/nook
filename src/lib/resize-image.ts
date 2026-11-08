// 사진을 기기에서 줄여서 올린다 (브라우저 전용).
// - 긴 변 2000px, WebP(안 되는 브라우저는 JPEG). 2MB를 넘으면 더 줄인다.
// - canvas에 다시 그려서 만드므로 찍은 위치(GPS), 기기 정보 같은 사진 속 정보(EXIF)가 남지 않는다.
// - 사진 방향(세로로 찍은 사진)은 createImageBitmap이 반영한다.

const MAX_SIDE = 2000;
const MAX_BYTES = 2 * 1024 * 1024; // 버킷 제한과 같은 값

export type ResizedImage = { blob: Blob; width: number; height: number };

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function resizeImage(file: File): Promise<ResizedImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // 이 브라우저가 읽지 못하는 형식 (예: 일부 PC 브라우저의 HEIC)
    throw new Error("이 사진 형식은 열 수 없어요. JPG나 PNG로 바꿔서 올려 주세요.");
  }

  let side = MAX_SIDE;
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("사진을 줄이지 못했어요.");
      ctx.drawImage(bitmap, 0, 0, width, height);

      // WebP를 못 만드는 브라우저는 PNG를 돌려준다 → 그때는 JPEG
      let blob = await toBlob(canvas, "image/webp", 0.82);
      if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", 0.85);
      if (!blob) throw new Error("사진을 줄이지 못했어요.");
      if (blob.size <= MAX_BYTES) return { blob, width, height };
      side = Math.round(side * 0.75); // 아직 크면 더 작게
    }
  } finally {
    bitmap.close();
  }
  throw new Error("사진이 너무 커서 줄이지 못했어요.");
}
