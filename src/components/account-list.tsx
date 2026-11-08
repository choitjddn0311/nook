"use client";

import { useState } from "react";
import { SignupRow, signupLabel } from "@/components/signup-row";
import type { Signup } from "@/lib/database.types";
import { fieldClass } from "@/lib/form-styles";

// 관리자 대시보드의 계정 목록. 사람 수가 적어 화면에서 바로 거른다.
export function AccountList({ accounts }: { accounts: Signup[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? accounts.filter((a) => signupLabel(a).toLowerCase().includes(q)) : accounts;

  return (
    <>
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
        className={`${fieldClass} mt-4`}
      />
      <p role="status" className="sr-only">
        {q ? `${shown.length}개 계정` : ""}
      </p>
      {shown.length === 0 ? (
        <p className="mt-4 text-[15px] text-text-muted">{q ? "맞는 계정이 없어요." : "아직 계정이 없어요."}</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {shown.map((s) => (
            <SignupRow key={s.id} signup={s} variant="account" />
          ))}
        </ul>
      )}
    </>
  );
}
