"use client";

import { useState } from "react";
import { primaryButton, secondaryButton } from "@/lib/button-styles";

// 복구 코드를 딱 한 번 보여 주는 화면 조각. 저장했다고 체크해야 다음으로 넘어간다.
// 원문은 DB에 없어서 이 화면을 벗어나면 다시 볼 수 없다.
// 다음 화면으로 갈 때는 페이지를 새로 불러온다: Next는 지나온 화면을 메모리에 숨겨 두므로, 코드가 남지 않게 비운다.
export function RecoveryCodeNotice({ code, nextHref, nextLabel }: { code: string; nextHref: string; nextLabel: string }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false); // 복사가 막힌 브라우저에서는 코드를 직접 옮겨 적는다
    }
  }

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">복구 코드를 저장해 주세요</h1>
      <p className="mt-3 text-base leading-relaxed text-text-muted">
        비밀번호를 잊었을 때 이 코드로 다시 정할 수 있어요. 지금만 볼 수 있고, 코드까지 잃어버리면 계정을 되찾을 수 없어요.
      </p>

      <p className="mt-6 rounded-lg bg-surface px-4 py-4 text-center text-lg font-semibold tracking-wide break-all text-text tabular-nums select-all">
        {code}
      </p>
      <button type="button" onClick={copy} className={`${secondaryButton} mt-3 w-full`}>
        {copied ? "복사했어요" : "복사하기"}
      </button>
      {/* 복사 결과를 화면 낭독기에도 알린다 */}
      <span role="status" className="sr-only">
        {copied ? "복구 코드를 복사했어요." : ""}
      </span>

      <label className="mt-6 flex min-h-11 cursor-pointer items-center gap-3 text-base text-text">
        <input
          type="checkbox"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
          className="size-5 shrink-0 accent-(--accent)"
        />
        안전한 곳에 저장했어요
      </label>

      <button type="button" disabled={!saved} onClick={() => window.location.assign(nextHref)} className={`${primaryButton} mt-3 w-full`}>
        {nextLabel}
      </button>
    </div>
  );
}
