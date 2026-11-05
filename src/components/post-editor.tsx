"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { TagInput } from "@/components/tag-input";
import type { EditorState } from "@/lib/post-form";

type Props = {
  action: (prev: EditorState, formData: FormData) => Promise<EditorState>;
  initial?: { title: string; content: string; tags: string[] };
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
};

// 글쓰기·수정 화면이 함께 쓰는 에디터.
// 칸 테두리 없이 종이처럼 두고, 포커스가 가면 surface 배경 + 왼쪽 본문색 막대(3px)로 지금 쓰는 칸을 보여 준다.
// (배경 차이만으로는 대비가 1.1:1이라 부족 → 막대는 15:1 이상)
export function PostEditor({ action, initial, submitLabel, pendingLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    tags: initial?.tags ?? [],
  });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      // ⌘+Enter (Mac) / Ctrl+Enter (Windows)로 바로 저장
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !pending) {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
      }}
      className="flex flex-1 flex-col"
    >
      <label htmlFor="title" className="sr-only">
        제목 (선택)
      </label>
      <input
        id="title"
        name="title"
        type="text"
        maxLength={200}
        defaultValue={state.title}
        placeholder="제목 (선택)"
        autoComplete="off"
        enterKeyHint="next"
        // 제목에서 엔터를 치면 저장되지 않고 본문으로 넘어간다 (한글 조합 중 엔터는 무시)
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing && !(e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            document.getElementById("content")?.focus();
          }
        }}
        className="-mx-3 rounded-lg bg-transparent px-3 py-2 text-2xl leading-tight font-semibold tracking-[-0.02em] text-text transition-colors placeholder:text-text-muted focus:bg-surface focus:shadow-[inset_3px_0_0_var(--accent)] focus-visible:outline-none"
      />

      <label htmlFor="content" className="sr-only">
        본문
      </label>
      <textarea
        id="content"
        name="content"
        defaultValue={state.content}
        placeholder="떠오르는 대로 적어 보세요."
        autoFocus
        required
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "editor-error" : undefined}
        className="-mx-3 mt-2 min-h-[50vh] flex-1 resize-none rounded-lg bg-transparent px-3 py-2 text-[17px] leading-[1.8] text-text transition-colors field-sizing-content placeholder:text-text-muted focus:bg-surface focus:shadow-[inset_3px_0_0_var(--accent)] focus-visible:outline-none"
      />

      <TagInput defaultTags={state.tags} />

      {/* 하단 고정 바: 폰에서 엄지가 닿는 곳에 저장 버튼 */}
      <div className="sticky bottom-0 -mx-4 mt-4 bg-bg px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6">
        <p id="editor-error" role="alert" className="mb-2 min-h-5 text-sm font-medium text-text empty:mb-0 empty:min-h-0">
          {state.error}
        </p>
        <div className="flex items-center justify-end gap-2">
          <Link
            href={cancelHref}
            className="inline-flex h-12 items-center rounded-lg px-4 text-base text-text-muted transition-[color,transform] duration-100 ease-out hover:text-text active:scale-[0.98]"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="h-12 min-w-28 rounded-lg bg-accent px-6 text-base font-semibold text-accent-contrast transition-[transform,opacity] duration-100 ease-out active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? pendingLabel : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
