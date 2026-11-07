"use client";

import { logout } from "@/app/auth-actions";
import { quietButton } from "@/lib/button-styles";
import { clearAllDrafts } from "@/lib/drafts";

// 로그아웃: 이 기기에 남은 쓰던 글(임시본)을 먼저 지우고 서버에서 로그아웃한다.
// 같은 기기를 다른 사람이 쓰게 되어도 내 임시 글이 남지 않는다.
export function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form action={logout} onSubmit={() => clearAllDrafts()} className={className}>
      <button type="submit" className={`${quietButton} -ml-3`}>
        로그아웃
      </button>
    </form>
  );
}
