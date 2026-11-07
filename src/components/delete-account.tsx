"use client";

import { useActionState, useRef } from "react";
import { deleteAccount, type DeleteAccountState } from "@/app/me/actions";
import { primaryButton, quietButton } from "@/lib/button-styles";
import { clearAllDrafts } from "@/lib/drafts";
import { fieldClass, labelClass } from "@/lib/form-styles";

const initial: DeleteAccountState = { error: null, done: false };

// 창의 면이 surface라서 입력칸은 반대로 bg 색을 쓴다
const dialogField = fieldClass.replace("bg-surface", "bg-bg");

// 탈퇴는 되돌릴 수 없으므로 '탈퇴'를 직접 입력하게 한다. 내보내기를 먼저 권한다.
export function DeleteAccount({ hasPassword, canExport }: { hasPassword: boolean; canExport: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // 탈퇴하면 로그인이 사라져 이 컴포넌트도 화면에서 빠지므로, 서버 동작이 끝난 자리에서 바로 이동한다.
  // 페이지를 새로 불러와 메모리에 숨겨진 화면까지 비운다.
  const [state, action, pending] = useActionState(async (prev: DeleteAccountState, formData: FormData) => {
    const result = await deleteAccount(prev, formData);
    if (result.done) {
      clearAllDrafts();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 일부러 전체 새로고침
      window.location.assign("/");
    }
    return result;
  }, initial);

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className={`${quietButton} -ml-3`}>
        탈퇴하기
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-desc"
        onClick={(e) => {
          if (e.target === e.currentTarget && !pending) e.currentTarget.close();
        }}
        className="m-auto w-[min(100%-2rem,24rem)] rounded-xl bg-surface p-6 text-text ring-1 ring-border backdrop:bg-bg/70 backdrop:backdrop-blur-sm"
      >
        <h2 id="delete-account-title" className="text-lg font-semibold tracking-[-0.01em]">
          정말 탈퇴할까요?
        </h2>
        <p id="delete-account-desc" className="mt-2 text-base leading-relaxed text-text-muted">
          계정과 모든 글, 덧붙인 생각이 바로 지워지고 되살릴 수 없어요.
          {canExport && " 필요하면 먼저 내 글을 내보내 두세요."}
        </p>
        <form action={action} className="mt-5 flex flex-col gap-4" noValidate>
          {hasPassword && (
            <div className="flex flex-col gap-2">
              <label htmlFor="delete-password" className={labelClass}>
                비밀번호
              </label>
              <input id="delete-password" name="password" type="password" autoComplete="current-password" required className={dialogField} />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label htmlFor="delete-confirm" className={labelClass}>
              확인을 위해 &lsquo;탈퇴&rsquo;를 입력해 주세요
            </label>
            <input id="delete-confirm" name="confirm" type="text" autoComplete="off" required className={dialogField} />
          </div>
          <p role="alert" className="text-sm font-medium empty:hidden">
            {state.error}
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" autoFocus onClick={() => dialogRef.current?.close()} disabled={pending} className={quietButton}>
              취소
            </button>
            <button type="submit" disabled={pending} className={primaryButton}>
              {pending ? "탈퇴하는 중…" : "탈퇴하기"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
