"use client";

import { useState } from "react";
import { SignupRow, accountColumns, signupLabel } from "@/components/signup-row";
import type { Signup } from "@/lib/database.types";
import { fieldClass } from "@/lib/form-styles";

type Filter = Signup["status"] | "all";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "approved", label: "승인됨" },
  { value: "pending", label: "대기" },
  { value: "rejected", label: "거절됨" },
];

// 관리자 대시보드의 계정 표. 사람 수가 적어 화면에서 바로 찾고 거른다.
// shortcut: 쪽 나누기·정렬 선택 없음(최근 가입순 고정), 계정이 수백 명을 넘으면 서버에서 나눠 읽기
export function AccountList({ accounts }: { accounts: Signup[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Filter>("all");
  const q = query.trim().toLowerCase();
  const shown = accounts.filter((a) => (status === "all" || a.status === status) && (!q || signupLabel(a).toLowerCase().includes(q)));
  const filtered = q !== "" || status !== "all";

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label htmlFor="account-search" className="sr-only">
          아이디나 이메일로 찾기
        </label>
        <input
          id="account-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="아이디나 이메일로 찾기"
          autoComplete="off"
          spellCheck={false}
          className={`${fieldClass} lg:w-72`}
        />
        <div role="group" aria-label="상태로 거르기" className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={status === f.value}
              onClick={() => setStatus(f.value)}
              className={`relative inline-flex h-9 items-center rounded-full px-3.5 text-sm whitespace-nowrap transition-[color,background-color,transform] duration-100 ease-out after:absolute after:inset-x-0 after:-inset-y-1 active:scale-[0.97] ${status === f.value ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-text-muted hover:text-text"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <p role="status" className="sr-only">
        {filtered ? `${shown.length}개 계정` : ""}
      </p>
      {shown.length === 0 ? (
        <p className="mt-6 text-[15px] text-text-muted">{filtered ? "맞는 계정이 없어요." : "아직 계정이 없어요."}</p>
      ) : (
        <>
          {/* PC 표 머리줄. 칸 내용은 각 줄에 숨은 이름표로도 읽힌다 */}
          <div aria-hidden="true" className={`mt-4 hidden border-b border-border pb-2 text-sm text-text-muted ${accountColumns}`}>
            <span>계정</span>
            <span>상태</span>
            <span className="text-right">글</span>
            <span className="text-right">사진</span>
            <span>가입일</span>
            <span />
          </div>
          <ul className="mt-2 divide-y divide-border lg:mt-0">
            {shown.map((s) => (
              <SignupRow key={s.id} signup={s} variant="account" />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
