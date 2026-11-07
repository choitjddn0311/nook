"use client";

import { logout } from "@/app/auth-actions";
import { quietButton } from "@/lib/button-styles";
import { clearAllDrafts } from "@/lib/drafts";

// 로그아웃: 이 기기에 남은 쓰던 글(임시본)을 지우고 서버에서 로그아웃한 뒤 페이지를 새로 불러온다.
// Next는 지나온 화면을 메모리에 숨겨 두므로, 새로 불러와야 내 글이 화면 메모리에도 남지 않는다.
export function LogoutButton({ className = "" }: { className?: string }) {
  async function action() {
    clearAllDrafts();
    await logout();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 일부러 전체 새로고침 (위 설명)
    window.location.assign("/");
  }

  return (
    <form action={action} className={className}>
      <button type="submit" className={`${quietButton} -ml-3`}>
        로그아웃
      </button>
    </form>
  );
}
