// 자동 저장 엔진. 에디터(post-editor.tsx)가 하나 만들어서 쓴다.
//
// 흐름
// 1) update(값): 입력이 바뀔 때마다 호출
//    - 0.3초 묶어서 이 기기(localStorage)에 임시 보관
//    - 입력이 1.5초 멈추면 DB 저장(save)
// 2) save(): 동시에 두 번 보내지 않는다. 저장 중에 또 바뀌면 끝난 뒤 한 번 더 저장
//    - 새 글은 이 기기에서 id를 미리 정해 두고(newId) 첫 저장 때 그 id로 만든다.
//      창이 첫 저장 도중 닫혀 같은 임시본이 다시 저장돼도, 서버는 같은 id라 글을 하나만 둔다(중복 방지).
//    - 본문이 비면 저장하지 않는다 (빈 글로 덮어쓰지 않음)
//    - 인터넷이 없으면 기기에만 두고 offline 상태로
// 3) flush(): 기다리지 말고 지금 저장하고, 끝날 때까지 기다린다 (완료 버튼, 앱 전환 시)
import { savePost } from "@/app/posts/actions";
import { clearDraft, newPostId, sameValue, writeDraft } from "@/lib/drafts";
import type { PostValue } from "@/lib/post-form";

export type SaveStatus = "idle" | "saving" | "saved" | "offline" | "error" | "empty";

const SAVE_DELAY = 1500;
const DRAFT_DELAY = 300;

type Options = {
  id: string | null;
  saved: PostValue; // 지금 DB에 들어 있는 내용
  onStatus: (status: SaveStatus, message?: string) => void;
  onCreated: (id: string) => void; // 새 글이 DB에 처음 생겼을 때
};

export function createAutosaver({ id: initialId, saved: initialSaved, onStatus, onCreated }: Options) {
  let id = initialId;
  // 새 글 id는 처음 필요할 때(첫 임시 보관·첫 저장) 브라우저에서 만든다 (서버에서 화면을 미리 만들 때 무작위 값 금지)
  let newId: string | null = null;
  const ensureNewId = () => (id ? null : (newId ??= newPostId()));
  let saved = initialSaved;
  let latest = initialSaved;
  let status: SaveStatus = "idle";
  let inFlight: Promise<void> | null = null;
  let again = false;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let draftTimer: ReturnType<typeof setTimeout> | undefined;

  const setStatus = (next: SaveStatus, message?: string) => {
    status = next;
    onStatus(next, message);
  };

  const isDirty = () => !sameValue(latest, saved);

  function writeDraftNow() {
    clearTimeout(draftTimer);
    if (isDirty()) writeDraft(id, latest, ensureNewId());
  }

  async function runSave() {
    if (!isDirty()) {
      clearDraft(id);
      if (status !== "idle") setStatus("saved");
      return;
    }
    if (!latest.content.trim()) {
      // 새 글이면 아직 아무것도 만들지 않은 상태, 기존 글이면 빈 본문으로 덮어쓰지 않음
      setStatus(id ? "empty" : "idle");
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      writeDraftNow();
      setStatus("offline");
      return;
    }

    const sending = latest;
    setStatus("saving");
    try {
      const res = await savePost({ id: id ?? ensureNewId()!, isNew: !id, ...sending });
      if (!res.ok) {
        writeDraftNow();
        setStatus("error", res.error);
        return;
      }
      if (!id) {
        clearDraft(null); // '새 글' 임시본은 이제 이 글 id의 임시본으로 옮겨 간다
        id = res.id;
        newId = null;
        onCreated(res.id);
      }
      saved = sending;
      if (isDirty()) writeDraft(id, latest);
      else clearDraft(id);
      setStatus("saved");
    } catch {
      // 서버에 닿지 못함 (인터넷 끊김 등). 기기에는 보관돼 있다.
      writeDraftNow();
      setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error", "저장하지 못했어요.");
    }
  }

  async function save(): Promise<void> {
    clearTimeout(saveTimer);
    if (inFlight) {
      again = true;
      return inFlight;
    }
    inFlight = runSave();
    try {
      await inFlight;
    } finally {
      inFlight = null;
    }
    if (again) {
      again = false;
      await save();
    }
  }

  return {
    // 이어 쓰기: 새 글 임시본에 담겨 있던 id를 그대로 이어받는다 (같은 글로 저장되게)
    adoptNewId(draftNewId: string | undefined) {
      if (!id && draftNewId) newId = draftNewId;
    },
    update(value: PostValue) {
      latest = value;
      clearTimeout(draftTimer);
      clearTimeout(saveTimer);
      if (!isDirty()) return;
      draftTimer = setTimeout(writeDraftNow, DRAFT_DELAY);
      saveTimer = setTimeout(save, SAVE_DELAY);
    },
    // 지금 바로 저장하고 끝날 때까지 기다린 뒤, 마지막 상태를 돌려준다
    async flush(): Promise<SaveStatus> {
      await save();
      while (inFlight) await inFlight;
      return status;
    },
    // 저장할 것 없이 끝낼 때(본문 없이 끝낸 새 글): 대기 중인 저장·임시본을 모두 버린다
    discard() {
      clearTimeout(saveTimer);
      clearTimeout(draftTimer);
      latest = saved;
      clearDraft(id);
    },
    // 화면을 떠날 때: 타이머를 멈추고, 저장 안 된 내용은 기기에 남긴 뒤 저장을 한 번 시도
    dispose() {
      clearTimeout(saveTimer);
      if (isDirty()) {
        writeDraftNow();
        void save();
      }
    },
    get id() {
      return id;
    },
    get dirty() {
      return isDirty();
    },
  };
}

export type Autosaver = ReturnType<typeof createAutosaver>;
