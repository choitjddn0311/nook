"use server";

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
