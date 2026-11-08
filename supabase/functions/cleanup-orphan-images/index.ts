// 주인 없는 사진 파일 정리 (Supabase Edge Function, Deno)
// 매일 한국 시간 4시 30분에 DB 예약 작업(pg_cron)이 부른다.
// 탈퇴·관리자 계정 삭제·올리다 멈춘 경우처럼 사진 정보(post_images) 없이 남은 파일을 지운다.
// Storage 파일은 SQL로 지울 수 없어서(Supabase가 막음) Storage API로 지운다.
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  // 예약 작업만 부를 수 있다: DB(Vault)에만 있는 비밀 값을 확인한다
  const { data: ok } = await supabase.rpc("check_push_cron_secret", { p_secret: req.headers.get("x-cron-secret") ?? "" });
  if (ok !== true) return new Response("forbidden", { status: 403 });

  // 한 번에 최대 1000개 (1시간 지난 것만). 남으면 다음 날 이어서 지운다
  const { data: paths, error } = await supabase.rpc("orphan_image_paths");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let removed = 0;
  const list = (paths ?? []) as string[];
  for (let i = 0; i < list.length; i += 100) {
    const { data } = await supabase.storage.from("post-images").remove(list.slice(i, i + 100));
    removed += data?.length ?? 0;
  }
  return Response.json({ found: list.length, removed });
});
