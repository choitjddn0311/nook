"use server";

import { DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettings, type WriteFrequency } from "@/lib/notification-settings";
import { createClient } from "@/lib/supabase/server";

export type PushKeys = { endpoint: string; p256dh: string; auth: string };

// 알림 켜기: 이 기기의 푸시 주소를 내 계정에 묶는다 (DB 함수가 승인 여부와 값 모양을 확인한다)
export async function savePushSubscription(keys: PushKeys): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_push_subscription", {
    p_endpoint: keys.endpoint,
    p_p256dh: keys.p256dh,
    p_auth: keys.auth,
  });
  return { error: error ? "알림을 켜지 못했어요. 잠시 뒤에 다시 해 주세요." : null };
}

// 알림 끄기·로그아웃: 이 기기의 연결을 지운다 (RLS로 내 것만 지워진다)
export async function deletePushSubscription(endpoint: string) {
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

// 이 기기가 내 계정에 알림이 켜져 있는지. 같은 기기를 다른 계정이 썼을 수 있어 서버에 묻는다.
export async function isMyPushSubscription(endpoint: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("endpoint", endpoint);
  return (count ?? 0) > 0;
}

function hourOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 23 ? value : fallback;
}

// 알림 시간·글쓰기 알림 저장 (계정마다 하나, 알림을 켠 모든 기기에 적용).
// 화면에서 온 값은 믿지 않는다: 하나씩 확인하고, 이상하면 기본값을 쓴다. 범위는 DB 제약도 한 번 더 확인한다.
export async function saveNotificationSettings(input: NotificationSettings): Promise<{ error: string | null }> {
  const d = DEFAULT_NOTIFICATION_SETTINGS;
  const raw = (input ?? {}) as Partial<Record<keyof NotificationSettings, unknown>>;
  const frequency: WriteFrequency =
    raw.writeFrequency === "daily" || raw.writeFrequency === "weekly" || raw.writeFrequency === "off" ? raw.writeFrequency : d.writeFrequency;
  const weekday =
    typeof raw.writeWeekday === "number" && Number.isInteger(raw.writeWeekday) && raw.writeWeekday >= 0 && raw.writeWeekday <= 6
      ? raw.writeWeekday
      : d.writeWeekday;
  const row = {
    past_enabled: typeof raw.pastEnabled === "boolean" ? raw.pastEnabled : d.pastEnabled,
    past_hour: hourOr(raw.pastHour, d.pastHour),
    write_frequency: frequency,
    write_weekday: weekday,
    write_hour: hourOr(raw.writeHour, d.writeHour),
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  // user_id는 DB 기본값 auth.uid()가 채우고, RLS가 본인 것인지 확인한다
  const { error } = await supabase.from("notification_settings").upsert(row, { onConflict: "user_id" });
  return { error: error ? "저장하지 못했어요. 잠시 후 다시 해 주세요." : null };
}
