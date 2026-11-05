// .env.local 의 Supabase 접속 정보. 값이 없으면 바로 알 수 있게 에러를 낸다.
// (publishable 키는 브라우저에 노출돼도 되는 키다. 데이터는 RLS가 지킨다. secret 키는 절대 여기 두지 않는다.)

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    ".env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 넣어 주세요. (.env.example 참고)",
  );
}
