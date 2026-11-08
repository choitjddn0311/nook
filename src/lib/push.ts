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
