// 버튼 모양 한곳에서 관리. 화면마다 크기가 달라지지 않게 여기 클래스를 쓴다.
//
// - 보이는 높이는 40px로 조용하게, 누르는 영역은 after로 위아래를 넓혀 44px 이상 (CLAUDE.md 터치 기준)
// - 누르는 순간 살짝 눌리는 반응(active:scale)은 그대로

const buttonBase =
  "relative inline-flex h-10 shrink-0 items-center justify-center rounded-lg text-[15px] transition-[color,transform,opacity] duration-100 ease-out active:scale-[0.97] disabled:opacity-60 after:absolute after:-inset-x-1 after:-inset-y-1";

// 주요 버튼: 본문색 바탕 + 반전 글자 (저장·완료·고치기·새 글 쓰기)
export const primaryButton = `${buttonBase} bg-accent px-4 font-semibold text-accent-contrast`;

// 보조 버튼: 글자만 (취소·지우기·로그아웃 등)
export const quietButton = `${buttonBase} px-3 text-text-muted hover:text-text`;

// 보조 강조 버튼: 옅은 회색 면 + 본문색 글자 (한 화면에 주요 버튼이 이미 있을 때, 예: 글 보기의 '덧붙이기')
export const secondaryButton = `${buttonBase} bg-surface px-4 font-semibold text-text`;
