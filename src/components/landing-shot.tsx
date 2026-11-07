import Image from "next/image";

// 랜딩의 실제 화면 사진. 낮/밤 사진을 둘 다 두고 지금 테마에 맞는 것만 보여 준다 (globals.css의 .shot-light, .shot-dark).
// 사진은 테스트 계정의 가짜 글로 찍었다 (public/landing).
const SIZES = {
  home: [750, 1440],
  tag: [750, 1440],
  past: [750, 1440],
  note: [750, 1440],
  markdown: [2048, 1200],
  stats: [1440, 1424],
} as const;

export function LandingShot({
  name,
  alt,
  sizes,
  eager = false,
  className = "",
}: {
  name: keyof typeof SIZES;
  alt: string;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  const [width, height] = SIZES[name];
  const common = { width, height, sizes, loading: eager ? ("eager" as const) : ("lazy" as const) };
  return (
    <div className={`overflow-hidden rounded-2xl border border-border bg-bg ${className}`}>
      <Image {...common} alt={alt} src={`/landing/${name}-light.png`} className="shot-light h-auto w-full" />
      <Image {...common} alt={alt} src={`/landing/${name}-dark.png`} className="shot-dark h-auto w-full" />
    </div>
  );
}
