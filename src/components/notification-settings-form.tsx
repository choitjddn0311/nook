"use client";

import { useRef, useState } from "react";
import { saveNotificationSettings } from "@/app/me/push-actions";
import { hourLabel, WEEKDAYS, type NotificationSettings, type WriteFrequency } from "@/lib/notification-settings";

const HOURS = Array.from({ length: 24 }, (_, h) => h);

// 작은 선택 상자 (모노크롬, iOS에서 확대되지 않게 16px)
const selectClass =
  "h-11 rounded-lg bg-surface px-3 text-base text-text transition-shadow focus-visible:outline-none focus:shadow-[inset_0_0_0_2px_var(--accent)] disabled:opacity-50";

// 알림 시간·글쓰기 알림 설정 (계정마다 하나, 알림을 켠 모든 기기에 적용).
// 바꾸면 바로 저장한다: 매번 설정 전체를 서버에 보낸다 (폼 제출은 쓰지 않음, 끝나면 폼을 되돌리는 동작 때문)
// 저장은 한 번에 하나씩. 보내는 동안 또 바뀌면 끝난 뒤 최신 값으로 한 번 더 보낸다 (늦게 끝난 옛 값이 덮어쓰지 않게)
export function NotificationSettingsForm({ initial }: { initial: NotificationSettings }) {
  const [settings, setSettings] = useState(initial);
  const [status, setStatus] = useState("");
  const latest = useRef(initial);
  const saving = useRef(false);
  const dirty = useRef(false);

  async function flush() {
    saving.current = true;
    let error: string | null = null;
    try {
      do {
        dirty.current = false;
        ({ error } = await saveNotificationSettings(latest.current));
      } while (dirty.current);
    } catch {
      error = "저장하지 못했어요. 인터넷 연결을 확인해 주세요.";
    } finally {
      saving.current = false;
    }
    setStatus(error ?? "저장했어요");
  }

  function update(patch: Partial<NotificationSettings>) {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setSettings(next);
    setStatus("저장 중…");
    if (saving.current) dirty.current = true;
    else void flush();
  }

  return (
    <div className="flex flex-col">
      <fieldset className="py-3">
        <legend className="text-base text-text">지난 오늘 알림</legend>
        <p className="mt-1 text-[15px] leading-relaxed text-text-muted">
          한 달 전, 6개월 전, 1년 전 오늘 쓴 글이 있는 날에만 와요. 알림에 글 내용은 나오지 않아요.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-text">
            <input
              type="checkbox"
              checked={settings.pastEnabled}
              onChange={(e) => update({ pastEnabled: e.target.checked })}
              className="size-5 shrink-0 accent-(--accent)"
            />
            받기
          </label>
          <label className="flex items-center gap-2 text-[15px] text-text-muted">
            <span className="sr-only">지난 오늘 알림</span>시간
            <select
              value={settings.pastHour}
              onChange={(e) => update({ pastHour: Number(e.target.value) })}
              disabled={!settings.pastEnabled}
              className={selectClass}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <div className="border-t border-border" />
      <fieldset className="py-3">
        <legend className="text-base text-text">글쓰기 알림</legend>
        <p className="mt-1 text-[15px] leading-relaxed text-text-muted">
          정한 때에 한 줄 적어 보라고 알려 드려요. 그날(매주는 지난 7일 안에) 이미 글을 썼으면 오지 않아요.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label>
            <span className="sr-only">글쓰기 알림 받기</span>
            <select
              value={settings.writeFrequency}
              onChange={(e) => update({ writeFrequency: e.target.value as WriteFrequency })}
              className={selectClass}
            >
              <option value="off">받지 않기</option>
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
            </select>
          </label>
          {settings.writeFrequency === "weekly" && (
            <label>
              <span className="sr-only">요일</span>
              <select
                value={settings.writeWeekday}
                onChange={(e) => update({ writeWeekday: Number(e.target.value) })}
                className={selectClass}
              >
                {WEEKDAYS.map((day, i) => (
                  <option key={day} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
          )}
          {settings.writeFrequency !== "off" && (
            <label>
              <span className="sr-only">글쓰기 알림 시간</span>
              <select
                value={settings.writeHour}
                onChange={(e) => update({ writeHour: Number(e.target.value) })}
                className={selectClass}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {hourLabel(h)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </fieldset>

      <p role="status" className="min-h-5 pb-2 text-sm text-text-muted">
        {status}
      </p>
    </div>
  );
}
