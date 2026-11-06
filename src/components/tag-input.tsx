"use client";

import { useId, useRef, useState } from "react";
import { TAG_MAX_COUNT, TAG_SEPARATOR, normalizeTag, parseTags } from "@/lib/tags";

// 태그 입력칸.
// - 엔터·쉼표·공백으로 태그 확정, 칩의 ×로 지우기, 빈칸에서 Backspace로 마지막 태그 지우기
// - 한글 조합 중(isComposing)에는 엔터/공백으로 끊지 않는다 ("일ㄱ"에서 잘리는 문제 방지)
// - 태그 목록은 부모(에디터)가 갖고 있고, 바뀔 때마다 onChange로 알려 준다 → 자동 저장
// - 쓰다 만 글자는 칸을 벗어날 때(blur) 태그로 확정된다
export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const setTags = onChange;
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const full = tags.length >= TAG_MAX_COUNT;

  function commit(text: string) {
    const next = parseTags([...tags, text]).slice(0, TAG_MAX_COUNT);
    setTags(next);
    setDraft("");
  }

  function remove(tag: string) {
    setTags(tags.filter((t) => t !== tag));
    inputRef.current?.focus();
  }

  return (
    <div className="-mx-3 mt-2 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center rounded-full bg-surface text-sm text-text">
          <span className="pl-3">#{tag}</span>
          <button
            type="button"
            onClick={() => remove(tag)}
            aria-label={`${tag} 태그 지우기`}
            // 보이는 크기는 32px, 누르는 영역은 after로 44px까지 넓힌다
            className="relative grid size-8 place-items-center rounded-full text-text-muted transition-colors after:absolute after:-inset-1.5 hover:text-text"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </span>
      ))}

      <label htmlFor="tag-input" className="sr-only">
        태그
      </label>
      <input
        ref={inputRef}
        id="tag-input"
        type="text"
        value={draft}
        disabled={full}
        autoComplete="off"
        autoCapitalize="none"
        enterKeyHint="enter"
        placeholder={full ? `태그는 ${TAG_MAX_COUNT}개까지` : tags.length ? "태그 더하기" : "#태그 (엔터로 추가)"}
        aria-describedby={hintId}
        onChange={(e) => {
          const value = e.target.value;
          // 쉼표·공백을 치거나 붙여넣으면 앞부분을 태그로 확정
          if (TAG_SEPARATOR.test(value) && !(e.nativeEvent as InputEvent).isComposing) {
            const parts = value.split(TAG_SEPARATOR);
            const rest = parts.pop() ?? "";
            const next = parseTags([...tags, ...parts]).slice(0, TAG_MAX_COUNT);
            setTags(next);
            setDraft(rest);
          } else {
            setDraft(value);
          }
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Enter" && !(e.metaKey || e.ctrlKey)) {
            // 엔터는 저장이 아니라 태그 확정. (⌘/Ctrl+Enter는 에디터가 저장으로 처리)
            e.preventDefault();
            if (normalizeTag(draft)) commit(draft);
          } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
            setTags(tags.slice(0, -1));
          }
        }}
        onBlur={() => {
          if (normalizeTag(draft)) commit(draft);
        }}
        className="h-9 min-w-32 flex-1 bg-transparent text-base text-text caret-accent placeholder:text-text-muted focus-visible:outline-none disabled:cursor-not-allowed"
      />
      <p id={hintId} className="sr-only">
        엔터, 쉼표, 띄어쓰기로 태그를 추가합니다. 최대 {TAG_MAX_COUNT}개.
      </p>
    </div>
  );
}
