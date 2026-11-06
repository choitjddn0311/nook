"use client";

import { primaryButton } from "@/lib/button-styles";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { TagInput } from "@/components/tag-input";
import { createAutosaver, type SaveStatus } from "@/lib/autosaver";
import { clearDraft, readDraft, sameValue } from "@/lib/drafts";
import type { PostFormat, PostValue } from "@/lib/post-form";
import { formatTextStats } from "@/lib/text-stats";

type Props = {
  initial: PostValue & { id: string | null; updatedAt: string | null };
};

// Markdown 미리보기는 Markdown으로 쓸 때만 내려받는다 (일반 글만 쓰면 이 코드를 받지 않음)
const MarkdownPreview = dynamic(() => import("@/components/markdown-view").then((m) => m.MarkdownView), {
  ssr: false,
  loading: () => <p className="text-sm text-text-muted">미리보기를 준비하는 중…</p>,
});

// 새 글을 어떤 방식으로 시작할지 이 기기에 기억 (마지막에 고른 방식)
const FORMAT_KEY = "nook-default-format";
function readDefaultFormat(): PostFormat {
  try {
    return localStorage.getItem(FORMAT_KEY) === "markdown" ? "markdown" : "plain";
  } catch {
    return "plain";
  }
}
function rememberFormat(format: PostFormat) {
  try {
    localStorage.setItem(FORMAT_KEY, format);
  } catch {
    // 저장이 막혀 있으면 기억만 못 한다
  }
}

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: "",
  saving: "저장 중…",
  saved: "저장됨",
  offline: "오프라인이라 이 기기에 보관했어요",
  error: "저장하지 못했어요. 잠시 후 다시 저장할게요",
  empty: "본문이 비어 있어 저장하지 않았어요",
};

// 글쓰기·고치기 화면이 함께 쓰는 에디터. 자동 저장된다(저장 버튼 없음).
// 칸 테두리·배경·막대 없이 깨끗한 종이처럼 둔다 (Apple 메모처럼).
// 지금 쓰는 칸은 깜빡이는 커서(본문색)로 보인다 — 글자 입력칸에서는 커서가 포커스 표시 역할을 한다(WCAG 2.4.7).
export function PostEditor({ initial }: Props) {
  const router = useRouter();
  const [value, setValue] = useState<PostValue>({
    title: initial.title,
    content: initial.content,
    tags: initial.tags,
    format: initial.format,
  });
  const [tab, setTab] = useState<"write" | "preview">("write"); // 폰에서 Markdown 쓰기/미리보기
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  // 자동 저장 엔진 (화면이 살아 있는 동안 하나)
  const [saver] = useState(() =>
    createAutosaver({
      id: initial.id,
      saved: { title: initial.title, content: initial.content, tags: initial.tags, format: initial.format },
      onStatus: (s, message) => {
        setStatus(s);
        setErrorText(s === "error" ? (message ?? null) : null);
      },
      onCreated: (id) => {
        // 새 글이 생기면 주소를 고치기 주소로 조용히 바꾼다 (새로고침해도 같은 글을 이어서 쓰도록)
        window.history.replaceState(null, "", `/posts/${id}/edit`);
        document.title = "글 고치기 · Nook";
      },
    }),
  );

  function change(patch: Partial<PostValue>) {
    const next = { ...value, ...patch };
    setValue(next);
    saver.update(next);
    if (notice) setNotice(null);
  }

  // 이 기기에 DB보다 새 임시본이 있으면 이어서 불러온다 (인터넷이 끊겼을 때 쓴 내용 등)
  useEffect(() => {
    // 이 글이 '새 글' 화면에서 만들어졌는데 그때의 임시본이 남아 있다면 정리 (이미 이 글로 저장됨)
    if (initial.id && readDraft(null)?.newId === initial.id) clearDraft(null);

    const draft = readDraft(initial.id);
    if (!draft) {
      // 새 글은 마지막에 고른 방식(일반/Markdown)으로 시작한다
      if (!initial.id && readDefaultFormat() !== initial.format) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValue((v) => ({ ...v, format: readDefaultFormat() }));
      }
      return;
    }
    const serverTime = initial.updatedAt ? Date.parse(initial.updatedAt) : 0;
    const current = { title: initial.title, content: initial.content, tags: initial.tags, format: initial.format };
    if (draft.savedAt <= serverTime || sameValue(draft, current) || !draft.content.trim()) {
      clearDraft(initial.id);
      return;
    }
    const restored = { title: draft.title, content: draft.content, tags: draft.tags, format: draft.format };
    // 브라우저 저장소는 화면이 뜬 뒤에만 읽을 수 있어서 effect 안에서 한 번 반영한다
    setValue(restored);
    setNotice("이 기기에 저장 안 된 내용이 있어 이어서 불러왔어요.");
    saver.adoptNewId(draft.newId);
    saver.update(restored);
    void saver.flush();
  }, [initial, saver]);

  // 인터넷이 돌아오면 저장, 다른 앱으로 넘어가거나 창을 닫으면 바로 저장, 화면을 떠나면 마무리
  useEffect(() => {
    const flush = () => void saver.flush();
    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("online", flush);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", flush);
      saver.dispose();
    };
  }, [saver]);

  function chooseFormat(format: PostFormat) {
    if (format === value.format) return;
    change({ format });
    rememberFormat(format);
    setTab("write");
  }

  const markdown = value.format === "markdown";

  async function finish() {
    if (finishing) return;
    setFinishing(true);
    const result = await saver.flush();
    if (result === "offline" || result === "error") {
      setNotice("인터넷이 연결되면 저장돼요. 이 기기에는 보관돼 있어요.");
      setFinishing(false);
      return;
    }
    if (result === "empty" && saver.id) {
      setNotice("본문이 비어 있어요. 글을 없애려면 글 보기에서 지우기를 눌러 주세요.");
      setFinishing(false);
      return;
    }
    if (!saver.id) saver.discard(); // 본문 없이 끝낸 새 글: 기기 임시본도 남기지 않는다
    router.push(saver.id ? `/posts/${saver.id}` : "/");
  }

  const statusText = status === "error" && errorText && errorText !== "저장하지 못했어요." ? errorText : STATUS_TEXT[status];

  return (
    <div
      // Markdown이면 PC(lg)에서 쓰기·미리보기를 나란히 놓도록 본문 폭(42rem)보다 넓게 편다
      className={
        "flex flex-1 flex-col " +
        (markdown ? "lg:relative lg:left-1/2 lg:w-[min(64rem,calc(100vw-3rem))] lg:-translate-x-1/2" : "")
      }
      // ⌘+Enter (Mac) / Ctrl+Enter (Windows)로 완료
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          void finish();
        }
      }}
    >
      {notice && (
        <p role="status" className="mb-2 rounded-lg bg-surface px-3 py-2 text-sm text-text">
          {notice}
        </p>
      )}

      {/* 글 방식: 일반 / Markdown (고른 방식은 다음 새 글에도 기억) */}
      <div className="mb-1 flex items-center justify-end gap-2">
        {markdown && (
          // 폰에서만: 쓰기 / 미리보기 전환 (PC는 나란히 보여서 필요 없음)
          <div role="group" aria-label="쓰기·미리보기" className="mr-auto flex rounded-full bg-surface p-0.5 lg:hidden">
            {(
              [
                ["write", "쓰기"],
                ["preview", "미리보기"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
                className={
                  "relative h-9 rounded-full px-3.5 text-sm transition-colors after:absolute after:-inset-y-1 after:inset-x-0 " +
                  (tab === key ? "bg-bg font-semibold text-text" : "text-text-muted hover:text-text")
                }
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div role="group" aria-label="글 방식" className="flex rounded-full bg-surface p-0.5">
          {(
            [
              ["plain", "일반"],
              ["markdown", "Markdown"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={value.format === key}
              onClick={() => chooseFormat(key)}
              className={
                "relative h-9 rounded-full px-3.5 text-sm transition-colors after:absolute after:-inset-y-1 after:inset-x-0 " +
                (value.format === key ? "bg-bg font-semibold text-text" : "text-text-muted hover:text-text")
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <label htmlFor="title" className="sr-only">
        제목 (선택)
      </label>
      <input
        id="title"
        type="text"
        maxLength={200}
        value={value.title}
        onChange={(e) => change({ title: e.target.value })}
        placeholder="제목 (선택)"
        autoComplete="off"
        enterKeyHint="next"
        // 제목에서 엔터를 치면 본문으로 넘어간다 (한글 조합 중 엔터는 무시)
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing && !(e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            document.getElementById("content")?.focus();
          }
        }}
        className="-mx-3 rounded-lg bg-transparent px-3 py-2 text-2xl leading-tight font-semibold tracking-[-0.02em] text-text caret-accent placeholder:text-text-muted focus-visible:outline-none"
      />

      <div className={markdown ? "mt-2 flex flex-1 flex-col lg:grid lg:grid-cols-2 lg:gap-6" : "mt-2 flex flex-1 flex-col"}>
        <label htmlFor="content" className="sr-only">
          본문
        </label>
        <textarea
          id="content"
          value={value.content}
          onChange={(e) => change({ content: e.target.value })}
          placeholder={markdown ? "Markdown으로 적어 보세요. **굵게**, # 제목, - 목록" : "떠오르는 대로 적어 보세요."}
          autoFocus
          aria-describedby="editor-stats"
          className={
            "-mx-3 min-h-[50vh] flex-1 resize-none rounded-lg bg-transparent px-3 py-2 text-[17px] leading-[1.8] text-text caret-accent field-sizing-content placeholder:text-text-muted focus-visible:outline-none " +
            (markdown && tab === "preview" ? "hidden lg:block" : "")
          }
        />
        {markdown && (
          // 미리보기: 옅은 surface 면으로 '쓰는 칸이 아님'을 구분
          <section
            aria-label="미리보기"
            className={"min-h-[50vh] rounded-lg bg-surface px-4 py-3 " + (tab === "write" ? "hidden lg:block" : "")}
          >
            {value.content.trim() ? (
              <MarkdownPreview content={value.content} />
            ) : (
              <p className="text-sm text-text-muted">미리 볼 내용이 아직 없어요.</p>
            )}
          </section>
        )}
      </div>

      <TagInput tags={value.tags} onChange={(tags) => change({ tags })} />

      {/* 하단 고정 바: 왼쪽 저장 상태·글자 수, 오른쪽 완료 (폰 엄지 영역) */}
      <BottomBar className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0 text-sm leading-snug">
          {/* 상태가 바뀔 때만 화면 낭독기가 읽는다 */}
          <p role="status" className="truncate text-text">
            {statusText}
          </p>
          <p id="editor-stats" className="text-text-muted">
            {formatTextStats(value.content)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void finish()}
          disabled={finishing}
          className={primaryButton}
        >
          {finishing ? "저장 중…" : "완료"}
        </button>
      </BottomBar>
    </div>
  );
}
