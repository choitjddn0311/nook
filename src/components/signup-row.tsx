"use client";

import { useActionState } from "react";
import { setSignupStatus, type StatusResult } from "@/app/admin/actions";
import { primaryButton, quietButton, secondaryButton } from "@/lib/button-styles";
import type { Signup } from "@/lib/database.types";

const PROVIDER: Record<string, string> = { email: "이메일", google: "Google", kakao: "카카오" };
const STATUS: Record<Signup["status"], string> = { pending: "대기", approved: "승인됨", rejected: "거절됨" };

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
});

// 관리자 화면의 가입 계정 한 줄: 이메일 · 가입 방식 · 신청일 + 승인/거절
export function SignupRow({ signup }: { signup: Signup }) {
  const [state, action, pending] = useActionState<StatusResult, FormData>(setSignupStatus, { error: null });
  const label = signup.email ?? "(이메일 없음)";

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-base text-text">{label}</p>
        <p className="mt-0.5 text-sm text-text-muted">
          {PROVIDER[signup.provider] ?? signup.provider} · {dateFormat.format(new Date(signup.created_at))} 신청
          {signup.status !== "pending" && <> · {STATUS[signup.status]}</>}
        </p>
        {state.error && (
          <p role="alert" className="mt-1 text-sm text-text">
            {state.error}
          </p>
        )}
      </div>
      <form action={action} className="flex shrink-0 items-center gap-2" aria-label={`${label} 처리`}>
        <input type="hidden" name="target" value={signup.id} />
        {signup.status !== "approved" && (
          <button type="submit" name="status" value="approved" disabled={pending} className={primaryButton}>
            승인
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
    </li>
  );
}
