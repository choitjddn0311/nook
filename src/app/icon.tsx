import { renderAppIcon } from "@/lib/app-icon";

// 브라우저 탭 아이콘 + 홈 화면 설치용 아이콘(manifest). 주소: /icon/32, /icon/192, /icon/512
const SIZES = [32, 192, 512] as const;

export function generateImageMetadata() {
  return SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const size = Number(await id);
  return renderAppIcon(SIZES.includes(size as (typeof SIZES)[number]) ? size : 192);
}
