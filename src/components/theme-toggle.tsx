"use client";

import { useEffect, useSyncExternalStore } from "react";
import { THEME_BG, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const CHANGE_EVENT = "nook-theme-change";

// 지금 화면에 실제로 적용된 테마를 계산한다.
// 직접 고른 값(data-theme)이 있으면 그것, 없으면 시스템 설정.
function getTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

let themeChangeTimer: ReturnType<typeof setTimeout> | undefined;

function applyTheme(theme: Theme) {
  // 바뀌는 동안만 모든 요소에 색 전환을 켠다 (globals.css의 .theme-changing)
  const root = document.documentElement;
  root.classList.add("theme-changing");
  clearTimeout(themeChangeTimer);
  themeChangeTimer = setTimeout(() => root.classList.remove("theme-changing"), 300);
  root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 사파리 개인정보 보호 모드 등에서는 저장이 안 될 수 있다. 이번 방문 동안만 적용된다.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function ThemeToggle() {
  // 서버에서는 테마를 알 수 없으므로 null. 브라우저에서 hydration 직후 실제 값으로 바뀐다.
  const theme = useSyncExternalStore<Theme | null>(subscribe, getTheme, () => null);

  // 폰 주소창 색(theme-color)을 실제 테마에 맞춘다.
  // 서버 HTML의 theme-color는 시스템 설정 기준이라, 사용자가 반대 테마를 골라 두면
  // 새로고침 직후 주소창만 다른 색이 된다 → 처음 불러올 때와 테마가 바뀔 때마다 동기화.
  useEffect(() => {
    if (theme === null) return;
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", THEME_BG[theme]));
  }, [theme]);
  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = theme === null ? "낮/밤 바꾸기" : next === "dark" ? "밤으로 바꾸기" : "낮으로 바꾸기";

  return (
    <button
      type="button"
      // 렌더 시점 값이 아니라 누르는 순간 화면에 실제로 적용된 테마를 기준으로 뒤집는다
      onClick={() => applyTheme(getTheme() === "dark" ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="grid size-11 place-items-center rounded-full text-text-muted transition-[color,transform] duration-100 ease-out hover:text-text active:scale-95"
    >
      {/* 아이콘은 CSS로 고른다(globals.css의 .icon-day / .icon-night). 서버/브라우저 화면이 항상 같아서 깜빡임이 없다. */}
      <svg className="icon-night size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
      <svg className="icon-day size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
      </svg>
    </button>
  );
}
