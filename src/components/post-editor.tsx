"use client";

import { primaryButton } from "@/lib/button-styles";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { TagInput } from "@/components/tag-input";
import { createAutosaver, type SaveStatus } from "@/lib/autosaver";
import { clearDraft, readDraft, sameValue } from "@/lib/drafts";
import type { PostValue } from "@/lib/post-form";
import { formatTextStats } from "@/lib/text-stats";

type Props = {
  initial: PostValue & { id: string | null; updatedAt: string | null };
};

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: "",
  saving: "저장 중…",
  saved: "저장됨",
  offline: "오프라인이라 이 기기에 보관했어요",
  error: "저장하지 못했어요. 잠시 후 다시 저장할게요",
  empty: "본문이 비어 있어 저장하지 않았어요",
};

// 글쓰기·고치기 화면이 함께 쓰는 에디터. 자동 저장된다(저장 버튼 없음).
// 칸 테두리 없이 종이처럼 두고, 포커스가 가면 왼쪽 본문색 막대(3px, 대비 15:1 이상)로 지금 쓰는 칸을 보여 준다.
// (예전엔 회색 배경도 깔았는데, 본문 칸이 화면 절반 높이라 회색 덩어리처럼 무거워 보여서 막대만 남김)
export function PostEditor({ initial }: Props) {
  const router = useRouter();
  const [value, setValue] = useState<PostValue>({ title: initial.title, content: initial.content, tags: initial.tags });
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  // 자동 저장 엔진 (화면이 살아 있는 동안 하나)
  const [saver] = useState(() =>
    createAutosaver({
      id: initial.id,
      saved: { title: initial.title, content: initial.content, tags: initial.tags },
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
    if (!draft) return;
    const serverTime = initial.updatedAt ? Date.parse(initial.updatedAt) : 0;
    const current = { title: initial.title, content: initial.content, tags: initial.tags };
    if (draft.savedAt <= serverTime || sameValue(draft, current) || !draft.content.trim()) {
      clearDraft(initial.id);
      return;
    }
    const restored = { title: draft.title, content: draft.content, tags: draft.tags };
    // 브라우저 저장소는 화면이 뜬 뒤에만 읽을 수 있어서 effect 안에서 한 번 반영한다
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      className="flex flex-1 flex-col"
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
        className="-mx-3 rounded-lg bg-transparent px-3 py-2 text-2xl leading-tight font-semibold tracking-[-0.02em] text-text transition-shadow placeholder:text-text-muted focus:shadow-[inset_3px_0_0_var(--accent)] focus-visible:outline-none"
      />

      <label htmlFor="content" className="sr-only">
        본문
      </label>
      <textarea
        id="content"
        value={value.content}
        onChange={(e) => change({ content: e.target.value })}
        placeholder="떠오르는 대로 적어 보세요."
        autoFocus
        aria-describedby="editor-stats"
        className="-mx-3 mt-2 min-h-[50vh] flex-1 resize-none rounded-lg bg-transparent px-3 py-2 text-[17px] leading-[1.8] text-text transition-shadow field-sizing-content placeholder:text-text-muted focus:shadow-[inset_3px_0_0_var(--accent)] focus-visible:outline-none"
      />

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
