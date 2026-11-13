"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { primaryButton, quietButton } from "@/lib/button-styles";
import { enablePushOnThisDevice, getDeviceSubscription, supportsPush } from "@/lib/push";

// 글을 쓰고 '완료'로 글 보기에 왔을 때 한 번, 알림을 켤지 묻는 안내 창.
// 브라우저 권한 창은 한 번 거부하면 다시 물을 수 없어서, 여기서 '알림 켜기'를 누른 사람에게만 띄운다.
// '나중에'는 7일 뒤 한 번 더 묻고, 두 번 거절하면 다시 묻지 않는다(마이페이지에서는 언제든 켤 수 있음).

export const JUST_WROTE_KEY = "nook-just-wrote"; // 편집기 finish()가 남기는 표시 (sessionStorage)
const DISMISS_KEY = "nook-push-prompt"; // 이 기기의 거절 기록 (localStorage): { dismissed: 1|2, at }
const ASK_AGAIN_AFTER = 7 * 24 * 60 * 60 * 1000;

type Dismissed = { dismissed: number; at: number };

function readDismissed(): Dismissed | null {
  try {
    const value = JSON.parse(localStorage.getItem(DISMISS_KEY) ?? "null");
    return value && typeof value.dismissed === "number" && typeof value.at === "number" ? value : null;
  } catch {
    return null;
  }
}

// 표시는 읽기만 하고, 띄울지 정한 뒤에 지운다 (개발 모드에서 effect가 두 번 돌아도 한 번은 제대로 정하도록)
function justWrote() {
  try {
    return sessionStorage.getItem(JUST_WROTE_KEY) === "1";
  } catch {
    return false;
  }
}

function clearJustWrote() {
  try {
    sessionStorage.removeItem(JUST_WROTE_KEY);
  } catch {
    // 지우지 못해도 다음 글 보기에서 한 번 더 판단할 뿐이다
  }
}

async function shouldAsk() {
  if (!justWrote()) return false; // 방금 쓴 글이 아니면 묻지 않는다 (새로고침·목록에서 온 경우)
  // 아이폰 Safari 탭이거나 거부됨. '허용'은 묻는다: 다른 계정이 켰다가 로그아웃해 이 계정은 구독이 없을 수 있다
  if (!supportsPush() || Notification.permission === "denied") return false;
  if (await getDeviceSubscription().catch(() => null)) return false;
  const d = readDismissed();
  if (!d) return true;
  return d.dismissed < 2 && Date.now() - d.at >= ASK_AGAIN_AFTER;
}

export function PushPrompt() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const enableRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void shouldAsk().then((ask) => {
      if (cancelled) return;
      clearJustWrote();
      if (!ask) return;
      dialogRef.current?.showModal();
      enableRef.current?.focus(); // 처음 포커스는 '알림 켜기' (안내 속 링크가 아니라)
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // '나중에' (Esc, 바깥 누르기 포함): 거절 횟수를 늘린다
  function later() {
    try {
      const d = readDismissed();
      localStorage.setItem(DISMISS_KEY, JSON.stringify({ dismissed: (d?.dismissed ?? 0) + 1, at: Date.now() }));
    } catch {
      // 저장이 막혀 있으면 다음에 또 물을 수 있다
    }
    dialogRef.current?.close();
  }

  async function turnOn() {
    setBusy(true);
    setMessage(null);
    const result = await enablePushOnThisDevice();
    setBusy(false);
    if (result === "on") {
      setMessage("알림을 켰어요.");
      setTimeout(() => dialogRef.current?.close(), 1200);
    } else if (result === "denied") {
      setMessage("알림이 막혔어요. 기기나 브라우저 설정에서 Nook 알림을 허용하면 켤 수 있어요.");
    } else if (result === "dismissed") {
      later();
    } else {
      setMessage(result.error);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="push-prompt-title"
      aria-describedby="push-prompt-desc"
      onCancel={(e) => {
        e.preventDefault(); // Esc도 '나중에'로 기록
        if (!busy) later();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) later();
      }}
      className="m-auto w-[min(100%-2rem,24rem)] rounded-xl bg-surface p-6 text-text ring-1 ring-border backdrop:bg-bg/70 backdrop:backdrop-blur-sm"
    >
      <h2 id="push-prompt-title" className="text-lg leading-snug font-semibold tracking-[-0.01em] text-balance">
        1년 뒤 오늘, 이 글을 다시 알려 드릴까요?
      </h2>
      <p id="push-prompt-desc" className="mt-2 text-base leading-relaxed text-text-muted">
        한 달 뒤, 6개월 뒤, 1년 뒤 같은 날 아침에 알려 드려요. 알림에 글 내용은 나오지 않아요. 시간과 글쓰기 알림은{" "}
        <Link href="/me#me-alerts" className="text-text underline underline-offset-4">
          마이페이지
        </Link>
        에서 정할 수 있어요.
      </p>
      <p role="status" className="mt-3 text-sm font-medium text-text empty:hidden">
        {message}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={later} disabled={busy} className={quietButton}>
          나중에
        </button>
        <button ref={enableRef} type="button" onClick={() => void turnOn()} disabled={busy} className={primaryButton}>
          {busy ? "켜는 중…" : "알림 켜기"}
        </button>
      </div>
    </dialog>
  );
}
