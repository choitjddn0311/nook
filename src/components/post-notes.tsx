"use client";

import { useState, useTransition } from "react";
import { addNote, deleteNote } from "@/app/posts/[id]/note-actions";
import type { PostNote } from "@/lib/database.types";
import { quietButton, secondaryButton } from "@/lib/button-styles";
import { formatPostDate } from "@/lib/format";

// 글 보기 아래 '덧붙인 생각'. 원래 글은 그대로 두고, 날짜별로 지금의 생각을 차례로 붙인다.
export function PostNotes({ postId, initialNotes }: { postId: string; initialNotes: PostNote[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null); // 지울지 묻고 있는 메모 id
  const [pending, startTransition] = useTransition();

  function submit() {
    if (pending) return;
    startTransition(async () => {
      const res = await addNote(postId, draft);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNotes((prev) => [...prev, res.note]);
      setDraft("");
      setError(null);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteNote(id);
      if (!res.ok) {
        setError(res.error ?? "지우지 못했어요.");
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setConfirming(null);
      setError(null);
    });
  }

  return (
    <section aria-labelledby="notes-title" className="mt-10 border-t border-border pt-6">
      <h2 id="notes-title" className="text-base font-semibold text-text">
        덧붙인 생각
      </h2>

      {notes.length > 0 && (
        <ol className="mt-4 flex flex-col gap-6">
          {notes.map((note) => (
            <li key={note.id}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-text-muted">
                  <time dateTime={note.created_at}>{formatPostDate(note.created_at)}</time>에 덧붙인 생각
                </p>
                {/* 창을 띄우지 않고 그 자리에서 한 번 더 묻는다 */}
                {confirming === note.id ? (
                  <span className="flex items-center">
                    <span className="mr-1 text-sm text-text">지울까요?</span>
                    <button type="button" onClick={() => remove(note.id)} disabled={pending} className={`${quietButton} text-text`}>
                      지우기
                    </button>
                    <button type="button" onClick={() => setConfirming(null)} className={quietButton}>
                      취소
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(note.id)}
                    aria-label={`${formatPostDate(note.created_at)}에 덧붙인 생각 지우기`}
                    className={quietButton}
                  >
                    지우기
                  </button>
                )}
              </div>
              <p className="mt-1 text-[17px] leading-[1.8] whitespace-pre-wrap text-text">{note.content}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6">
        <label htmlFor="note-input" className="sr-only">
          지금의 생각 덧붙이기
        </label>
        <textarea
          id="note-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // ⌘/Ctrl+Enter로 바로 덧붙이기
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="지금의 생각을 덧붙여 보세요."
          rows={3}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "note-error" : undefined}
          className="-mx-3 block w-[calc(100%+1.5rem)] resize-none rounded-lg bg-transparent px-3 py-2 text-[17px] leading-[1.8] text-text transition-shadow field-sizing-content placeholder:text-text-muted focus:shadow-[inset_3px_0_0_var(--accent)] focus-visible:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p id="note-error" role="alert" className="text-sm font-medium text-text">
            {error}
          </p>
          <button type="button" onClick={submit} disabled={pending || !draft.trim()} className={secondaryButton}>
            {pending ? "덧붙이는 중…" : "덧붙이기"}
          </button>
        </div>
      </div>
    </section>
  );
}
