// 아이디 ↔ 내부 이메일 변환 (18단계).
// Supabase 로그인은 아이디를 직접 지원하지 않아서, 안에서는 '<아이디>@내부 도메인'으로 저장하고 화면에는 아이디만 보여 준다.
// .invalid는 실제로 존재할 수 없는 도메인(RFC 2606)이라 메일이 실수로 남에게 갈 일이 없다.
// DB 함수 reset_password_with_code에도 같은 도메인이 적혀 있다. 바꾸면 함께 바꾼다.
const INTERNAL_DOMAIN = "users.nook.invalid";

const RESERVED = new Set(["admin", "administrator", "nook", "root", "support", "system", "test"]);

// 문제가 없으면 null, 있으면 안내 문구
export function usernameError(username: string): string | null {
  if (!/^[a-z0-9_]{4,20}$/.test(username)) return "아이디는 영문 소문자, 숫자, _ 로 4~20자여야 해요.";
  if (RESERVED.has(username)) return "쓸 수 없는 아이디예요.";
  return null;
}

// 로그인 칸의 값 → Supabase에 넘길 이메일. '@'가 있으면 기존 이메일 계정으로 본다.
export function loginToEmail(login: string) {
  const value = login.trim().toLowerCase();
  return value.includes("@") ? value : `${value}@${INTERNAL_DOMAIN}`;
}

// 화면에 보여 줄 계정 이름: 아이디 계정은 아이디만, 나머지는 이메일 그대로
export function accountName(email: string | null | undefined) {
  if (!email) return null;
  const suffix = `@${INTERNAL_DOMAIN}`;
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : email;
}

export function isUsernameAccount(email: string | null | undefined) {
  return Boolean(email?.endsWith(`@${INTERNAL_DOMAIN}`));
}
