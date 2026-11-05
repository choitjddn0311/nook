import { ImageResponse } from "next/og";
import { ICON_COLORS } from "@/lib/theme";

// Nook 앱 아이콘: 방의 한쪽 구석(ㄴ자 선)과 그 안에 앉은 작은 점.
// 바탕을 꽉 채우고 무늬는 가운데 46% 안에만 둔다 → 안드로이드가 원·둥근 사각형으로 잘라도(maskable) 무늬가 잘리지 않는다.
// iOS는 모서리를 알아서 둥글게 깎으므로 여기서는 사각형 그대로 둔다.
// (아이콘 렌더러는 CSS border/inset 지원이 불완전해서 무늬는 SVG로 그린다)
export function renderAppIcon(size: number) {
  const box = Math.round(size * 0.46);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: ICON_COLORS.background,
        }}
      >
        <svg width={box} height={box} viewBox="0 0 100 100">
          {/* 구석: 왼쪽 벽에서 내려와 둥글게 꺾여 바닥으로 */}
          <path
            // 선 끝의 둥근 마감(굵기의 절반 = 6)이 그림 영역 밖으로 잘리지 않도록 6 이상 안쪽에서 시작·끝
            d="M 10 8 V 72 Q 10 90 28 90 H 92"
            fill="none"
            stroke={ICON_COLORS.mark}
            strokeWidth={12}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* 구석에 자리 잡은 작은 점 */}
          <circle cx={40} cy={60} r={12} fill={ICON_COLORS.mark} />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
