"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { completeOnboarding } from "@/app/auth-actions";
import { primaryButton, quietButton } from "@/lib/button-styles";

// 승인 후 처음 들어온 사람을 위한 사용법 안내 (19.5단계).
// 화면을 어둡게 하고 설명하는 버튼만 밝게 비춘다. 대상은 data-tour 표시로 찾는다.
// 네이티브 <dialog>라서 Esc로 닫기, 포커스 가두기, 뒤 화면 조작 막기를 브라우저가 처리한다.

type Step = { target?: string; title: string; body: string };

const STEPS: Step[] = [
  {
    title: "Nook에 가입하신 걸 환영해요!",
    body: "오늘의 생각을 다시 만나는 곳이에요. 어디에 무엇이 있는지 잠깐 둘러볼까요?",
  },
  {
    target: "write",
    title: "여기서 생각을 적어요",
    body: "제목 없이 몇 줄이면 충분해요. 저장 버튼은 없어요. 쓰는 동안 저절로 저장돼요.",
  },
  {
    target: "search",
    title: "적어 둔 글을 찾아요",
    body: "제목과 본문으로 찾을 수 있어요. 글이 쌓이면 태그와 별표로도 거를 수 있어요.",
  },
  {
    target: "random",
    title: "아무 글이나 꺼내 봐요",
    body: "무엇을 읽을지 모르겠을 때, 지난 글을 한 편 꺼내 줘요.",
  },
  {
    target: "past",
    title: "지난 오늘의 나를 만나요",
    body: "한 달 전, 6개월 전, 1년 전 오늘 쓴 글을 모아 보여 줘요. 다시 읽고 든 생각은 그 글 아래에 덧붙일 수 있어요.",
  },
  {
    target: "me",
    title: "쌓인 기록을 돌아봐요",
    body: "기록한 날, 연속 기록, 1년 활동 달력을 여기서 볼 수 있어요.",
  },
  {
    title: "이제 첫 글을 적어 볼까요?",
    body: "폰에서는 브라우저 메뉴의 '홈 화면에 추가'로 앱처럼 설치할 수 있어요. 오늘 든 생각 한 줄이면 충분해요.",
  },
];

type Rect = { left: number; top: number; width: number; height: number };

const PADDING = 6;
const CARD_WIDTH = 320;
const GAP = 14;

function findTarget(name: string) {
  // 지나온 화면이 숨겨진 채 남아 있을 수 있으므로 실제로 보이는 것만 고른다
  return [...document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)].find((el) => el.getClientRects().length > 0) ?? null;
}

export function Tutorial() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // 지금 단계의 대상 위치를 잰다. 대상이 아직 안 그려졌으면 잠깐 기다리고, 끝내 없으면 그 단계를 건너뛴다.
  const measure = useCallback(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    if (!step.target) {
      setRect(null);
      return true;
    }
    const el = findTarget(step.target);
    if (!el) return false;
    const box = el.getBoundingClientRect();
    setRect({
      left: box.left - PADDING,
      top: box.top - PADDING,
      width: box.width + PADDING * 2,
      height: box.height + PADDING * 2,
    });
    return true;
  }, [step.target]);

  useLayoutEffect(() => {
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const attempt = () => {
      if (step.target) findTarget(step.target)?.scrollIntoView({ block: "nearest" });
      if (measure()) return;
      tries += 1;
      if (tries < 30) timer = setTimeout(attempt, 50);
      else setIndex((i) => Math.min(i + 1, STEPS.length - 1));
    };
    attempt();
    primaryRef.current?.focus();
    return () => clearTimeout(timer);
  }, [index, measure, step.target]);

  // 화면 크기가 바뀌거나 스크롤되면 다시 잰다
  useEffect(() => {
    const onChange = () => measure();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [measure]);

  function finish(nextHref?: string) {
    dialogRef.current?.close();
    // 기록에 실패해도 사용을 막지 않는다. 다음에 한 번 더 나올 뿐이다.
    completeOnboarding().catch(() => {});
    if (nextHref) router.push(nextHref);
  }

  // 설명 상자 자리: 대상이 화면 아래쪽이면 위에, 위쪽이면 아래에. 화면 밖으로 나가지 않게 한다.
  const cardWidth = Math.min(CARD_WIDTH, viewport.width - 32);
  const cardStyle: React.CSSProperties = rect
    ? {
        width: cardWidth,
        left: Math.max(16, Math.min(rect.left + rect.width / 2 - cardWidth / 2, viewport.width - cardWidth - 16)),
        ...(rect.top + rect.height / 2 > viewport.height / 2
          ? { bottom: viewport.height - rect.top + GAP }
          : { top: rect.top + rect.height + GAP }),
      }
    : { width: cardWidth, left: (viewport.width - cardWidth) / 2, top: "50%", transform: "translateY(-50%)" };

  // 비추는 구멍: 가운데 단계에서는 크기 0
  const hole: Rect = rect ?? { left: viewport.width / 2, top: viewport.height / 2, width: 0, height: 0 };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="tutorial-title"
      aria-describedby="tutorial-body"
      onCancel={(e) => {
        e.preventDefault(); // Esc: 건너뛰기와 같게
        finish();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-transparent"
    >
      <div
        aria-hidden="true"
        style={hole}
        className={
          "fixed rounded-xl shadow-[0_0_0_200vmax_var(--scrim)] transition-[left,top,width,height] duration-200 ease-out " +
          (rect ? "outline-2 outline-accent" : "")
        }
      />

      {/* 단계가 바뀌면 화면 낭독기가 새 내용을 읽는다 */}
      <div style={cardStyle} className="fixed rounded-2xl border border-border bg-bg p-5">
        <div aria-live="polite">
          <h2 id="tutorial-title" className="text-lg leading-snug font-semibold tracking-[-0.01em] text-text">
            {step.title}
          </h2>
          <p id="tutorial-body" className="mt-2 text-[15px] leading-relaxed text-text-muted">
            {step.body}
          </p>
        </div>
        <div className="mt-5 flex items-center justify-between gap-2">
          <span className="text-sm text-text-muted tabular-nums">
            <span className="sr-only">{STEPS.length}단계 중 </span>
            {index + 1}
            <span aria-hidden="true"> / {STEPS.length}</span>
            <span className="sr-only">단계</span>
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => finish()} className={quietButton}>
              {isLast ? "나중에" : "건너뛰기"}
            </button>
            <button
              ref={primaryRef}
              type="button"
              onClick={() => (isLast ? finish("/write") : setIndex(index + 1))}
              className={primaryButton}
            >
              {isLast ? "첫 글 쓰기" : index === 0 ? "둘러보기" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
