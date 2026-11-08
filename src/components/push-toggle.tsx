"use client";

import { useEffect, useState } from "react";
import { deletePushSubscription, isMyPushSubscription, savePushSubscription } from "@/app/me/push-actions";
import { quietButton, secondaryButton } from "@/lib/button-styles";
import { base64UrlToBytes, getDeviceSubscription, VAPID_PUBLIC_KEY } from "@/lib/push";

type State = "checking" | "install" | "unsupported" | "denied" | "off" | "on";

const NOTE: Partial<Record<State, string>> = {
  install: "홈 화면에 추가한 Nook 앱에서 켤 수 있어요. 아이폰은 Safari 공유 버튼에서 '홈 화면에 추가'를 눌러 주세요.",
  unsupported: "이 브라우저에서는 알림을 받을 수 없어요.",
  denied: "알림이 막혀 있어요. 브라우저나 기기 설정에서 Nook 알림을 허용하면 켤 수 있어요.",
  on: "이 기기에서 켜져 있어요.",
};

function supported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// 지난 오늘 알림 켜기/끄기 (마이페이지). 기기마다 따로 켠다.
// 권한은 '켜기'를 누를 때만 묻는다.
export function PushToggle() {
  const [state, setState] = useState<State>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: State;
      if (!supported()) {
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
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      // 이전 키로 만든 구독이 남아 있으면 새로 만든다
      await (await registration.pushManager.getSubscription())?.unsubscribe();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY),
      });
      const keys = subscription.toJSON().keys ?? {};
      const result = await savePushSubscription({ endpoint: subscription.endpoint, p256dh: keys.p256dh ?? "", auth: keys.auth ?? "" });
      if (result.error) {
        await subscription.unsubscribe();
        setError(result.error);
        return;
      }
      setState("on");
    } catch {
      setError("알림을 켜지 못했어요. 잠시 뒤에 다시 해 주세요.");
    } finally {
      setBusy(false);
    }
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
        <p className="text-base text-text">지난 오늘 알림</p>
        <p className="mt-1 text-[15px] leading-relaxed text-text-muted">
          한 달 전, 6개월 전, 1년 전 오늘 쓴 글이 있는 날 아침 9시에 알려 드려요. 알림에 글 내용은 나오지 않아요.
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
