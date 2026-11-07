"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { homeHref, SEARCH_MAX, type HomeFilters } from "@/lib/home-filters";

// 홈 '새 글 쓰기' 위에 떠 있는 둥근 찾기 버튼 → 누르면 그 자리에서 왼쪽으로 늘어나는 짧은 검색칸.
// 검색어는 주소창(?q=)에 담기 때문에 새로고침·뒤로 가기에도 그대로다.
export function SearchPanel({ filters }: { filters: HomeFilters }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(filters.q ?? "");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const active = Boolean(filters.q);

  function close() {
    setOpen(false);
    // 닫으면 포커스를 버튼으로 돌려준다 (키보드 사용자가 길을 잃지 않게)
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  // 펼치면 바로 검색칸에 커서
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit() {
    const q = text.trim().slice(0, SEARCH_MAX);
    router.push(homeHref(filters, { q: q || null }));
    setOpen(false);
  }

  const magnifier = (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );

  return (
    <>
      {!open && (
        <button
          ref={buttonRef}
          type="button"
          data-tour="search"
          onClick={() => {
            setText(filters.q ?? "");
            setOpen(true);
          }}
          aria-expanded={false}
          aria-controls="search-panel"
          aria-label={active ? "찾기 (검색 중)" : "찾기"}
          className="absolute right-4 bottom-full z-10 mb-3 grid size-11 place-items-center rounded-full bg-surface text-text ring-1 ring-border transition-transform duration-100 ease-out active:scale-95 sm:right-6"
        >
          {magnifier}
          {/* 검색어가 걸려 있다는 작은 점 */}
          {active && <span className="absolute top-2 right-2 size-2 rounded-full bg-accent" aria-hidden="true" />}
        </button>
      )}

      {/* 바깥을 누르면 닫기만 한다: 투명한 막이 그 탭을 받아서 아래 글이 함께 열리지 않게 */}
      {open && <div className="fixed inset-0 z-[9]" aria-hidden="true" onPointerDown={() => close()} />}

      {open && (
        // 버튼과 같은 재질의 알약 모양이 버튼 자리(오른쪽)에서 왼쪽으로 늘어난다
        <form
          id="search-panel"
          role="search"
          aria-label="제목·본문에서 찾기"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
          className="search-grow absolute right-4 bottom-full z-10 mb-3 flex h-11 w-[min(18rem,calc(100%-2rem))] items-center gap-2 rounded-full bg-surface pr-1 pl-4 text-text ring-1 ring-border sm:right-6"
        >
          {magnifier}
          <label htmlFor="search-input" className="sr-only">
            제목·본문에서 찾기
          </label>
          <input
            ref={inputRef}
            id="search-input"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={SEARCH_MAX}
            enterKeyHint="search"
            autoComplete="off"
            placeholder="찾기"
            className="h-full min-w-0 flex-1 bg-transparent text-base text-text caret-accent placeholder:text-text-muted focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="grid size-9 shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:text-text"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </form>
      )}
    </>
  );
}
