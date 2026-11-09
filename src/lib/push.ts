import { savePushSubscription } from "@/app/me/push-actions";

// 지난 오늘 알림(웹 푸시)의 공개 키. 개인 키는 Supabase 비밀 값(VAPID_KEYS)에만 있다.
// 공개 키는 브라우저에 알려 줘야 하는 값이라 코드에 둬도 된다. 키를 바꾸면 모든 기기가 다시 켜야 한다.
export const VAPID_PUBLIC_KEY = "BOOPK4lic-RLKPt-t1IaBYF__e-QaxBw7eZDReDO6QkxKUBnlh1L6LQ_UQbWJa7T8YZhORmFS18p7CuAAzUc07s";

export function base64UrlToBytes(value: string) {
  const base64 = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

// 이 기기의 알림 구독 (없으면 null). 서비스워커가 없거나 브라우저가 지원하지 않아도 null.
export async function getDeviceSubscription(): Promise<PushSubscription | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  return (await registration?.pushManager?.getSubscription()) ?? null;
}

// 이 기기에서 웹 푸시가 되는지. 아이폰은 홈 화면에 추가한 앱에서만 된다(Safari 탭에서는 PushManager가 없음).
export function supportsPush() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export type EnableResult = "on" | "denied" | "dismissed" | { error: string };

// 이 기기에서 알림 켜기: 서비스워커 등록 → 브라우저 권한 묻기 → 구독 만들기 → 서버에 저장.
// 마이페이지의 켜기 버튼과 글을 쓴 뒤의 안내 창이 함께 쓴다. 버튼을 누른 순간에 불러야 권한 창이 뜬다.
export async function enablePushOnThisDevice(): Promise<EnableResult> {
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission === "denied") return "denied";
    if (permission !== "granted") return "dismissed"; // 권한 창을 그냥 닫음
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
      return { error: result.error };
    }
    return "on";
  } catch {
    return { error: "알림을 켜지 못했어요. 잠시 뒤에 다시 해 주세요." };
  }
}
