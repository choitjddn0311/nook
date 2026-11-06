"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { homeHref, SEARCH_MAX, type HomeFilters } from "@/lib/home-filters";

// 홈 '새 글 쓰기' 위에 떠 있는 둥근 찾기 버튼 → 누르면 버튼 쪽에서 위로 펼쳐지는 찾기·정렬 패널.
// 상태는 주소창(?q=&sort=)에 담기 때문에 새로고침·뒤로 가기에도 그대로다.
export function SearchPanel({ filters }: { filters: HomeFilters }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(filters.q ?? "");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const active = Boolean(filters.q) || filters.sort === "old";

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

  return (
    <>
      {!open && (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            setText(filters.q ?? "");
            setOpen(true);
          }}
          aria-expanded={false}
          aria-controls="search-panel"
          aria-label={active ? "찾기·정렬 (적용 중)" : "찾기·정렬"}
          className="absolute right-4 bottom-full z-10 mb-3 grid size-11 place-items-center rounded-full bg-surface text-text ring-1 ring-border transition-transform duration-100 ease-out active:scale-95 sm:right-6"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          {/* 검색·정렬이 걸려 있다는 작은 점 */}
          {active && <span className="absolute top-2 right-2 size-2 rounded-full bg-accent" aria-hidden="true" />}
        </button>
      )}

      {/* 바깥을 누르면 닫기만 한다: 투명한 막이 그 탭을 받아서 아래 글이 함께 열리지 않게 */}
      {open && <div className="fixed inset-0 z-[9]" aria-hidden="true" onPointerDown={() => close()} />}

      {open && (
        <div
          ref={panelRef}
          id="search-panel"
          role="dialog"
          aria-label="찾기와 정렬"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
          className="search-pop absolute inset-x-4 bottom-full z-10 mb-3 rounded-xl bg-surface p-4 ring-1 ring-border sm:inset-x-6"
        >
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-center gap-2"
          >
            <label htmlFor="search-input" className="sr-only">
              제목·본문에서 찾기
            </label>
            {/* 덧붙이기 칸과 같은 밑줄 입력칸 (보조 글자색 1px → 쓰는 중 본문색 2px) */}
            <input
              ref={inputRef}
              id="search-input"
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={SEARCH_MAX}
              enterKeyHint="search"
              autoComplete="off"
              placeholder="제목·본문에서 찾기"
              className="h-11 min-w-0 flex-1 bg-transparent px-0 text-base text-text caret-accent shadow-[inset_0_-1px_0_var(--text-muted)] transition-shadow placeholder:text-text-muted focus:shadow-[inset_0_-2px_0_var(--text)] focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={close}
              aria-label="닫기"
              className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:text-text"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </form>

          {/* 정렬: 누르면 바로 적용 */}
          <div role="group" aria-label="정렬" className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-bg p-1">
            {(
              [
                ["new", "최신순"],
                ["old", "오래된 순"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filters.sort === value}
                onClick={() => router.push(homeHref(filters, { sort: value, q: text.trim().slice(0, SEARCH_MAX) || null }))}
                className={
                  "h-10 rounded-md text-[15px] transition-colors " +
                  (filters.sort === value ? "bg-surface font-semibold text-text" : "text-text-muted hover:text-text")
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
