"use client";

import { useEffect, useState } from "react";
import { deletePushSubscription, isMyPushSubscription } from "@/app/me/push-actions";
import { quietButton, secondaryButton } from "@/lib/button-styles";
import { enablePushOnThisDevice, getDeviceSubscription, supportsPush } from "@/lib/push";

type State = "checking" | "install" | "unsupported" | "denied" | "off" | "on";

const NOTE: Partial<Record<State, string>> = {
  install: "홈 화면에 추가한 Nook 앱에서 켤 수 있어요. 아이폰은 Safari 공유 버튼에서 '홈 화면에 추가'를 눌러 주세요.",
  unsupported: "이 브라우저에서는 알림을 받을 수 없어요.",
  denied: "알림이 막혀 있어요. 브라우저나 기기 설정에서 Nook 알림을 허용하면 켤 수 있어요.",
  on: "이 기기에서 켜져 있어요.",
};

// 이 기기에서 알림 받기 켜기/끄기 (마이페이지). 기기마다 따로 켠다. 무슨 알림을 언제 받을지는 NotificationSettingsForm(계정 단위)
// 권한은 '켜기'를 누를 때만 묻는다.
export function PushToggle() {
  const [state, setState] = useState<State>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: State;
      if (!supportsPush()) {
        // 아이폰은 홈 화면 앱(standalone)에서만 웹 푸시가 된다
        next = window.matchMedia("(display-mode: standalone)").matches ? "unsupported" : "install";
      } else if (Notification.permission === "denied") {
        next = "denied";
      } else {
        const subscription = await getDeviceSubscription().catch(() => null);
        next = subscription && (await isMyPushSubscription(subscription.endpoint)) ? "on" : "off";
      }
      if (!cancelled) setState(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function turnOn() {
    setBusy(true);
    setError(null);
    const result = await enablePushOnThisDevice();
    if (result === "on") setState("on");
    else if (result === "denied") setState("denied");
    else if (result === "dismissed") setState("off");
    else setError(result.error);
    setBusy(false);
  }

  async function turnOff() {
    setBusy(true);
    setError(null);
    try {
      const subscription = await getDeviceSubscription();
      if (subscription) {
        await deletePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off");
    } catch {
      setError("알림을 끄지 못했어요. 잠시 뒤에 다시 해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const note = NOTE[state];

  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-base text-text">이 기기에서 알림 받기</p>
        <p className="mt-1 text-[15px] leading-relaxed text-text-muted">
          켜 둔 기기로 아래 알림이 와요. 폰, PC처럼 기기마다 따로 켜요.
        </p>
        <p role="status" className="mt-1 text-[15px] leading-relaxed text-text empty:hidden">
          {error ?? note ?? ""}
        </p>
      </div>
      {(state === "off" || state === "on") && (
        <button
          type="button"
          onClick={state === "on" ? turnOff : turnOn}
          disabled={busy}
          className={state === "on" ? `${quietButton} -ml-3 sm:ml-0` : `${secondaryButton} self-start`}
        >
          {busy ? (state === "on" ? "끄는 중…" : "켜는 중…") : state === "on" ? "끄기" : "켜기"}
        </button>
      )}
    </div>
  );
}
