import type { PostImage } from "@/lib/post-images";

// 글 보기의 사진들 (본문 아래, 태그 위). 1장은 원래 비율 그대로 크게, 2장 이상은 2열 정사각형.
// 누르면 원래 크기 사진이 새 탭에서 열린다. 주소는 1시간만 열리는 서명 주소.
export function PostImages({ images }: { images: PostImage[] }) {
  if (images.length === 0) return null;
  const altOf = (image: PostImage, i: number) => image.alt ?? `사진 ${i + 1} / ${images.length}`;

  if (images.length === 1) {
    const [image] = images;
    return (
      <a href={image.url} target="_blank" rel="noopener" className="mt-8 block overflow-hidden rounded-xl bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element -- 서명 주소(1시간)라 이미지 최적화를 거치지 않는다 */}
        <img src={image.url} alt={altOf(image, 0)} width={image.width} height={image.height} className="h-auto w-full" />
      </a>
    );
  }

  return (
    <ul aria-label={`사진 ${images.length}장`} className="mt-8 grid grid-cols-2 gap-2">
      {images.map((image, i) => (
        <li key={image.id}>
          <a href={image.url} target="_blank" rel="noopener" className="block aspect-square overflow-hidden rounded-xl bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element -- 서명 주소(1시간)라 이미지 최적화를 거치지 않는다 */}
            <img src={image.url} alt={altOf(image, i)} loading="lazy" className="size-full object-cover" />
          </a>
        </li>
      ))}
    </ul>
  );
}
