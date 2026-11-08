"use client";

import { useActionState, useRef } from "react";
import { updateInquiry, type InquiryResult } from "@/app/admin/actions";
import { primaryButton, quietButton, secondaryButton } from "@/lib/button-styles";
import type { Inquiry } from "@/lib/admin";

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// 관리자 대시보드의 문의 한 줄: 보낸 이메일, 때, 내용 + 답장하기(메일 앱) · 답장 완료 · 삭제
export function InquiryRow({ inquiry }: { inquiry: Inquiry }) {
  const [state, action, pending] = useActionState<InquiryResult, FormData>(updateInquiry, { error: null });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const answered = inquiry.answered_at !== null;
  const reply = `mailto:${inquiry.email}?subject=${encodeURIComponent("Nook 문의 답장")}`;
  const titleId = `inquiry-${inquiry.id}-title`;

  return (
    <li className="py-4">
      <p className="text-sm text-text-muted">
        <span className="break-all text-text">{inquiry.email}</span> · {dateFormat.format(new Date(inquiry.created_at))}
        {answered && " · 답장함"}
      </p>
      <p className={`mt-2 text-base leading-relaxed whitespace-pre-wrap break-words ${answered ? "text-text-muted" : "text-text"}`}>
        {inquiry.message}
      </p>
      {state.error && (
        <p role="alert" className="mt-1 text-sm text-text">
          {state.error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!answered && (
          <a href={reply} className={secondaryButton}>
            답장하기
          </a>
        )}
        <form action={action}>
          <input type="hidden" name="target" value={inquiry.id} />
          <button
            type="submit"
            name="action"
            value={answered ? "unanswered" : "answered"}
            disabled={pending}
            className={answered ? `${quietButton} -ml-3` : quietButton}
          >
            {answered ? "답장 안 함으로 되돌리기" : "답장 완료"}
          </button>
        </form>
        <button type="button" onClick={() => dialogRef.current?.showModal()} className={quietButton}>
          삭제
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === e.currentTarget && !pending) e.currentTarget.close();
        }}
        className="m-auto w-[min(100%-2rem,24rem)] rounded-xl bg-surface p-6 text-text ring-1 ring-border backdrop:bg-bg/70 backdrop:backdrop-blur-sm"
      >
        <h2 id={titleId} className="text-lg font-semibold tracking-[-0.01em]">
          이 문의를 지울까요?
        </h2>
        <p className="mt-2 text-base leading-relaxed text-text-muted">지우면 되살릴 수 없어요.</p>
        <form action={action} className="mt-6 flex justify-end gap-2">
          <input type="hidden" name="target" value={inquiry.id} />
          <button type="button" autoFocus onClick={() => dialogRef.current?.close()} disabled={pending} className={quietButton}>
            취소
          </button>
          <button type="submit" name="action" value="delete" disabled={pending} className={primaryButton}>
            {pending ? "지우는 중…" : "지우기"}
          </button>
        </form>
      </dialog>
    </li>
  );
}
