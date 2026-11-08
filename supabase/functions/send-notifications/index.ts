// Nook 알림 발송 (Supabase Edge Function, Deno)
// DB 예약 작업(pg_cron)이 매시 정각에 부른다. 지금 시각(한국 시간)을 고른 사람에게만, 종류마다 하루 한 번 보낸다.
// - 지난 오늘: 한 달 전·6개월 전·n년 전 오늘 쓴 글이 있을 때. 글 개수만 넣고 글 내용은 넣지 않는다.
// - 글쓰기: 매일(오늘 쓴 글이 없을 때) 또는 매주(지난 7일 안에 쓴 글이 없을 때)
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

type Kind = "past" | "write";
type Target = { id: string; endpoint: string; p256dh: string; auth: string; post_count: number; frequency: string | null };
type Message = { title: string; body: string; url: string; tag: string };

function seoulToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date()); // YYYY-MM-DD
}

function messageFor(kind: Kind, t: Target): Message {
  if (kind === "past") return { title: "Nook", body: `지난 오늘 쓴 글이 ${t.post_count}개 있어요`, url: "/past", tag: "on-this-day" };
  const body = t.frequency === "weekly" ? "이번 주 생각을 한 줄 남겨 볼까요?" : "오늘 생각을 한 줄 남겨 볼까요?";
  return { title: "Nook", body, url: "/write", tag: "write-reminder" };
}

async function send(target: Pick<Target, "endpoint" | "p256dh" | "auth">, message: Message) {
  const subscriber = appServer.subscribe({ endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } });
  try {
    await subscriber.pushTextMessage(JSON.stringify(message), {
      ttl: 60 * 60 * 6, // 기기가 꺼져 있어도 6시간 안에 켜지면 받는다
      urgency: webpush.Urgency.Normal,
      topic: message.tag, // 같은 종류의 안 받은 알림은 새 것으로 바꾼다
    });
    return "sent" as const;
  } catch (err) {
    // 404·410: 기기에서 알림을 끄거나 앱을 지워 더는 없는 주소
    const status = err instanceof webpush.PushMessageError ? err.response.status : 0;
    return status === 404 || status === 410 ? ("gone" as const) : ("failed" as const);
  }
}

async function sendKind(kind: Kind) {
  const { data, error } = await supabase.rpc("push_targets", { p_kind: kind });
  if (error) throw new Error(error.message);
  const results = await Promise.all(
    (data as Target[]).map(async (t) => ({ id: t.id, result: await send(t, messageFor(kind, t)) })),
  );
  const sent = results.filter((r) => r.result === "sent").map((r) => r.id);
  const gone = results.filter((r) => r.result === "gone").map((r) => r.id);
  const column = kind === "past" ? "last_sent_on" : "last_write_sent_on";
  if (sent.length) await supabase.from("push_subscriptions").update({ [column]: seoulToday() }).in("id", sent);
  if (gone.length) await supabase.from("push_subscriptions").delete().in("id", gone);
  return { sent: sent.length, gone: gone.length, failed: results.length - sent.length - gone.length };
}

Deno.serve(async (req) => {
  // 예약 작업만 부를 수 있다: DB(Vault)에만 있는 비밀 값을 확인한다
  const { data: ok } = await supabase.rpc("check_push_cron_secret", { p_secret: req.headers.get("x-cron-secret") ?? "" });
  if (ok !== true) return new Response("forbidden", { status: 403 });

  const body = await req.json().catch(() => ({}));

  // 실제 기기 시험용: 구독 하나에만 시험 알림. kind로 어떤 알림 모양인지 고른다 (같은 비밀 값이 필요하다)
  if (typeof body.testSubscriptionId === "string") {
    const { data } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("id", body.testSubscriptionId)
      .maybeSingle();
    if (!data) return Response.json({ test: "not found" });
    const message: Message =
      body.kind === "write"
        ? { title: "Nook", body: "오늘 생각을 한 줄 남겨 볼까요?", url: "/write", tag: "write-reminder" }
        : { title: "Nook", body: "알림이 잘 와요. 고른 시간에 알려 드릴게요.", url: "/past", tag: "on-this-day" };
    return Response.json({ test: await send(data, message) });
  }

  try {
    const [past, write] = await Promise.all([sendKind("past"), sendKind("write")]);
    return Response.json({ past, write });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
