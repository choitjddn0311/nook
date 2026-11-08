// 지난 오늘 알림 발송 (Supabase Edge Function, Deno)
// 매일 한국 시간 9시에 DB 예약 작업(pg_cron)이 부른다. 한 달 전·6개월 전·n년 전 오늘 쓴 글이 있는 사람에게만,
// 기기마다 하루 한 번 보낸다. 알림에는 글 개수만 넣고 글 내용은 넣지 않는다.
//
// 필요한 비밀 값 (Supabase → Edge Functions → Secrets): VAPID_KEYS (JWK 키 쌍 JSON)
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY는 Supabase가 자동으로 넣어 준다.
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@0.5.0";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const appServer = await webpush.ApplicationServer.new({
  contactInformation: "mailto:choitjddn0311@naver.com", // 푸시 서비스가 문제 있을 때 연락할 곳 (처리방침의 운영자 연락처)
  vapidKeys: await webpush.importVapidKeys(JSON.parse(Deno.env.get("VAPID_KEYS")!)),
});

type Target = { id: string; endpoint: string; p256dh: string; auth: string; post_count: number };

function seoulToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date()); // YYYY-MM-DD
}

async function send(target: Target, message: { title: string; body: string; url: string }) {
  const subscriber = appServer.subscribe({ endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } });
  try {
    await subscriber.pushTextMessage(JSON.stringify(message), {
      ttl: 60 * 60 * 12, // 기기가 꺼져 있어도 12시간 안에 켜지면 받는다
      urgency: webpush.Urgency.Normal,
      topic: "on-this-day", // 아직 안 받은 알림이 있으면 새 것으로 바꾼다
    });
    return "sent" as const;
  } catch (err) {
    // 404·410: 기기에서 알림을 끄거나 앱을 지워 더는 없는 주소
    const status = err instanceof webpush.PushMessageError ? err.response.status : 0;
    return status === 404 || status === 410 ? ("gone" as const) : ("failed" as const);
  }
}

Deno.serve(async (req) => {
  // 예약 작업만 부를 수 있다: DB(Vault)에만 있는 비밀 값을 확인한다
  const { data: ok } = await supabase.rpc("check_push_cron_secret", { p_secret: req.headers.get("x-cron-secret") ?? "" });
  if (ok !== true) return new Response("forbidden", { status: 403 });

  const body = await req.json().catch(() => ({}));

  // 실제 기기 시험용: 구독 하나에만 시험 알림 (같은 비밀 값이 필요하다)
  if (typeof body.testSubscriptionId === "string") {
    const { data } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("id", body.testSubscriptionId)
      .maybeSingle();
    if (!data) return Response.json({ test: "not found" });
    const result = await send({ ...data, post_count: 0 }, { title: "Nook", body: "알림이 잘 와요. 지난 오늘 쓴 글이 있는 날 아침에 알려 드릴게요.", url: "/past" });
    return Response.json({ test: result });
  }

  const { data: targets, error } = await supabase.rpc("push_targets_today");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results = await Promise.all(
    (targets as Target[]).map(async (t) => ({
      id: t.id,
      result: await send(t, { title: "Nook", body: `지난 오늘 쓴 글이 ${t.post_count}개 있어요`, url: "/past" }),
    })),
  );

  const sent = results.filter((r) => r.result === "sent").map((r) => r.id);
  const gone = results.filter((r) => r.result === "gone").map((r) => r.id);
  if (sent.length) await supabase.from("push_subscriptions").update({ last_sent_on: seoulToday() }).in("id", sent);
  if (gone.length) await supabase.from("push_subscriptions").delete().in("id", gone);

  return Response.json({ sent: sent.length, gone: gone.length, failed: results.length - sent.length - gone.length });
});
