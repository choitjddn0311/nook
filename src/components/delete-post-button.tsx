"use client";

import { useActionState, useRef } from "react";
import { deletePost, type DeleteState } from "@/app/posts/[id]/actions";

// 지우기는 되돌릴 수 없으므로 한 번 확인한다.
// 네이티브 <dialog>를 써서 Esc로 닫기, 포커스 가두기, 화면 낭독기 안내를 브라우저가 처리한다.
export function DeletePostButton({ postId }: { postId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState<DeleteState>(deletePost.bind(null, postId), { error: null });

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex h-12 items-center rounded-lg px-4 text-base text-text-muted transition-[color,transform] duration-100 ease-out hover:text-text active:scale-[0.98]"
      >
        지우기
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-title"
        aria-describedby="delete-desc"
        // 바깥(어두운 부분)을 누르면 닫기
        onClick={(e) => {
          if (e.target === e.currentTarget && !pending) e.currentTarget.close();
        }}
        // 창은 surface 면 + 옅은 테두리로 흐려진 배경과 구분 (bg와 같은 색이면 밤 테마에서 경계가 사라짐)
        className="m-auto w-[min(100%-2rem,24rem)] rounded-xl bg-surface p-6 text-text ring-1 ring-border backdrop:bg-bg/70 backdrop:backdrop-blur-sm"
      >
        <h2 id="delete-title" className="text-lg font-semibold tracking-[-0.01em]">
          이 글을 지울까요?
        </h2>
        <p id="delete-desc" className="mt-2 text-base leading-relaxed text-text-muted">
          지운 글은 다시 살릴 수 없어요.
        </p>
        <p role="alert" className="mt-3 min-h-5 text-sm font-medium empty:mt-0 empty:min-h-0">
          {state.error}
        </p>
        <form action={formAction} className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            disabled={pending}
            className="inline-flex h-12 items-center rounded-lg px-4 text-base text-text-muted transition-[color,transform] duration-100 ease-out hover:text-text active:scale-[0.98]"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-12 min-w-24 rounded-lg bg-accent px-5 text-base font-semibold text-accent-contrast transition-[transform,opacity] duration-100 ease-out active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "지우는 중…" : "지우기"}
          </button>
        </form>
      </dialog>
    </>
  );
}
