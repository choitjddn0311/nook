"use client";

import { useActionState, useRef } from "react";
import { deleteAccountAsAdmin, setSignupStatus, type DeleteResult, type StatusResult } from "@/app/admin/actions";
import { primaryButton, quietButton, secondaryButton } from "@/lib/button-styles";
import type { Signup } from "@/lib/database.types";
import { accountName, isUsernameAccount } from "@/lib/username";

const PROVIDER: Record<string, string> = { email: "이메일", google: "Google", kakao: "카카오" };
const STATUS: Record<Signup["status"], string> = { pending: "대기", approved: "승인됨", rejected: "거절됨" };

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function signupLabel(signup: Signup) {
  return accountName(signup.email) ?? "(이메일 없음)";
}

// 관리자 대시보드의 계정 한 줄.
// - pending: 승인 대기 목록 (승인·거절)
// - account: 계정 목록 (상태, 글 개수, 승인 취소·다시 승인, 삭제). 관리자 계정에는 버튼이 없다.
export function SignupRow({ signup, variant }: { signup: Signup; variant: "pending" | "account" }) {
  const [state, action, pending] = useActionState<StatusResult, FormData>(setSignupStatus, { error: null });
  const label = signupLabel(signup);
  const method = isUsernameAccount(signup.email) ? "아이디" : (PROVIDER[signup.provider] ?? signup.provider);
  const date = dateFormat.format(new Date(signup.created_at));

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-base text-text">{label}</p>
        <p className="mt-0.5 text-sm text-text-muted">
          {variant === "pending" ? (
            <>
              {method} · {date} 신청
            </>
          ) : (
            <>
              {method} · {date} 가입 · {signup.is_admin ? "관리자" : STATUS[signup.status]} ·{" "}
              <span className="tabular-nums">
                글 {signup.post_count.toLocaleString("ko-KR")}개 · 사진 {signup.image_count.toLocaleString("ko-KR")}장
              </span>
            </>
          )}
        </p>
        {state.error && (
          <p role="alert" className="mt-1 text-sm text-text">
            {state.error}
          </p>
        )}
      </div>
      {!signup.is_admin && (
        <div className="flex shrink-0 items-center gap-2">
          <form action={action} className="flex items-center gap-2" aria-label={`${label} 처리`}>
            <input type="hidden" name="target" value={signup.id} />
            {signup.status !== "approved" && (
              <button
                type="submit"
                name="status"
                value="approved"
                disabled={pending}
                className={variant === "pending" ? primaryButton : quietButton}
              >
                {variant === "pending" ? "승인" : "다시 승인"}
              </button>
            )}
            {signup.status !== "rejected" && (
              <button
                type="submit"
                name="status"
                value="rejected"
                disabled={pending}
                className={signup.status === "pending" ? secondaryButton : quietButton}
              >
                {signup.status === "approved" ? "승인 취소" : "거절"}
              </button>
            )}
          </form>
          {variant === "account" && <DeleteAccountButton signup={signup} label={label} />}
        </div>
      )}
    </li>
  );
}

// 계정 삭제: 되돌릴 수 없으므로 확인 창에서 한 번 더 묻는다 (기존 글 지우기와 같은 네이티브 dialog)
function DeleteAccountButton({ signup, label }: { signup: Signup; label: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState<DeleteResult, FormData>(deleteAccountAsAdmin, { error: null });

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className={quietButton}>
        삭제
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-${signup.id}-title`}
        aria-describedby={`delete-${signup.id}-desc`}
        onClick={(e) => {
          if (e.target === e.currentTarget && !pending) e.currentTarget.close();
        }}
        className="m-auto w-[min(100%-2rem,24rem)] rounded-xl bg-surface p-6 text-text ring-1 ring-border backdrop:bg-bg/70 backdrop:backdrop-blur-sm"
      >
        <h2 id={`delete-${signup.id}-title`} className="text-lg font-semibold tracking-[-0.01em] break-all">
          {label} 계정을 지울까요?
        </h2>
        <p id={`delete-${signup.id}-desc`} className="mt-2 text-base leading-relaxed text-text-muted">
          계정과 글 {signup.post_count.toLocaleString("ko-KR")}개, 사진 {signup.image_count.toLocaleString("ko-KR")}장, 덧붙인 생각이 지워지고 되살릴 수 없어요. 사진 파일은 하루 안에 정리돼요.
        </p>
        <p role="alert" className="mt-3 text-sm font-medium empty:hidden">
          {state.error}
        </p>
        <form action={action} className="mt-6 flex justify-end gap-2">
          <input type="hidden" name="target" value={signup.id} />
          <button type="button" autoFocus onClick={() => dialogRef.current?.close()} disabled={pending} className={quietButton}>
            취소
          </button>
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? "지우는 중…" : "지우기"}
          </button>
        </form>
      </dialog>
    </>
  );
}
