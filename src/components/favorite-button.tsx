"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/posts/[id]/actions";

// 글 보기의 ☆/★ 버튼. 누르는 즉시 바뀌고(기다리지 않음), 저장에 실패하면 되돌리고 알려 준다.
export function FavoriteButton({ postId, initial }: { postId: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    setFailed(false);
    startTransition(async () => {
      const res = await toggleFavorite(postId, next);
      if (!res.ok) {
        setOn(!next);
        setFailed(true);
      }
    });
  }

  return (
    <span className="flex items-center gap-1">
      {failed && (
        <span role="alert" className="text-sm text-text">
          저장하지 못했어요
        </span>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label="즐겨찾기"
        title={on ? "즐겨찾기 해제" : "즐겨찾기"}
        className="-mr-2.5 grid size-11 place-items-center rounded-full text-text transition-transform duration-100 ease-out active:scale-90"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
        </svg>
      </button>
    </span>
  );
}
