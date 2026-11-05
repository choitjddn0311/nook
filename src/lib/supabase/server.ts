import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// 서버(서버 컴포넌트, 서버 액션)에서 쓰는 Supabase 클라이언트.
// 로그인 정보는 쿠키에 있으므로 요청마다 새로 만든다(전역으로 재사용하면 다른 요청의 로그인 정보가 섞일 수 있다).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다. 로그인 유지(토큰 갱신)는 proxy가 매 요청마다 처리하므로 무시해도 된다.
        }
      },
    },
  });
}
