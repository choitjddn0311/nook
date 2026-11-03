// 낮/밤 테마 공통 상수.
// 실제 색상 토큰은 src/app/globals.css 에 있고, 여기 값은
// 브라우저 주소창 색(<meta name="theme-color">)처럼 CSS 변수를 쓸 수 없는 곳에만 사용한다.
// globals.css 의 --bg 값을 바꾸면 여기도 같이 바꾼다.

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "nook-theme";

export const THEME_BG: Record<Theme, string> = {
  light: "#F5EEE3",
  dark: "#1E1914",
};

// 첫 화면이 그려지기 전에 실행되는 스크립트.
// 사용자가 직접 고른 테마가 있으면 <html data-theme="..."> 로 적용하고,
// 없으면 아무것도 하지 않아 CSS의 prefers-color-scheme(시스템 설정)을 따른다.
// 이렇게 해야 새로고침할 때 반대 테마가 잠깐 번쩍이는 현상이 없다.
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;}}catch(e){}})();`;
