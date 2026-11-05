import { renderAppIcon } from "@/lib/app-icon";

// 아이폰·아이패드 홈 화면 아이콘 (iOS는 manifest 아이콘 대신 이것을 쓴다)
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderAppIcon(180);
}
