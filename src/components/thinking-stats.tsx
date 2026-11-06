import Link from "next/link";
import type { ThinkingStats } from "@/lib/stats";

// 16단계 생각 통계 화면 조각들 (서버 컴포넌트, 라이브러리 없음).
// 색은 모노크롬 토큰만: 많이 쓸수록 본문색(--text)에 가까워지는 한 가지 색 계열(순차 척도).
// 숫자는 막대 옆에 직접 쓰고, 칸·막대마다 마우스를 올리면 정확한 값(title), 화면 낭독기용 요약 문장도 둔다.

// 활동 달력 칸의 진하기 단계 (0: 안 씀, 1~3: 1개 / 2개 / 3개 이상)
const LEVEL_BG = [
  "bg-surface",
  "bg-[color-mix(in_oklab,var(--text)_35%,var(--surface))]",
  "bg-[color-mix(in_oklab,var(--text)_62%,var(--surface))]",
  "bg-text",
];
const level = (count: number) => (count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3);

function dayLabel(key: string) {
  const [, m, d] = key.split("-").map(Number);
  return `${m}월 ${d}일`;
}

export function StatNumbers({ stats }: { stats: ThinkingStats }) {
  const rows: [string, string, string?][] = [
    ["전체 기록", `${stats.total.toLocaleString("ko-KR")}개`],
    ["기록한 날", `${stats.daysWritten.toLocaleString("ko-KR")}일`],
    [
      "연속 기록",
      stats.currentStreak > 0 ? `${stats.currentStreak}일째` : "0일",
      stats.currentStreak > 0 && !stats.wroteToday ? "오늘 쓰면 이어져요" : undefined,
    ],
    ["가장 길게 이어 쓴 날", `${stats.longestStreak}일`],
  ];
  return (
    <dl className="divide-y divide-border">
      {rows.map(([label, value, hint]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-3">
          <dt className="text-[15px] text-text-muted">{label}</dt>
          <dd className="text-right">
            <span className="text-xl font-semibold tracking-[-0.01em] text-text tabular-nums">{value}</span>
            {hint && <span className="block text-sm text-text-muted">{hint}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ActivityCalendar({ stats }: { stats: ThinkingStats }) {
  const { weeks, monthMarks } = stats.calendar;
  const activeDays = weeks.flat().filter((c) => c && c.count > 0).length;
  const WEEKDAYS = ["일", "", "화", "", "목", "", "토"];
  return (
    <figure>
      <figcaption className="sr-only">최근 1년 활동 달력: {activeDays}일 동안 글을 썼어요.</figcaption>
      {/* 폰에서는 옆으로 넘겨 본다. dir=rtl로 처음부터 오른쪽 끝(최근 주)이 보이게 하고, 안쪽은 다시 왼쪽→오른쪽 */}
      <div dir="rtl" className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:px-0">
        <div dir="ltr" className="inline-flex gap-1.5 sm:gap-[2px]" aria-hidden="true">
          {/* 요일 이름 */}
          <div className="grid grid-rows-[1rem_repeat(7,0.75rem)] gap-[3px] pr-1 text-[10px] leading-3 text-text-muted sm:grid-rows-[1rem_repeat(7,9px)] sm:gap-[2px] sm:leading-[9px]">
            <span />
            {WEEKDAYS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
          {weeks.map((week, w) => {
            const mark = monthMarks.find((m) => m.week === w);
            return (
              <div key={w} className="grid grid-rows-[1rem_repeat(7,0.75rem)] gap-[3px] sm:grid-rows-[1rem_repeat(7,9px)] sm:gap-[2px]">
                <span className="relative text-[10px] leading-3 whitespace-nowrap text-text-muted">
                  {/* 마지막 몇 주의 달 이름은 오른쪽 끝에 맞춰 잘리지 않게 */}
                  {mark && <span className={"absolute " + (w >= weeks.length - 2 ? "right-0" : "left-0")}>{mark.label}</span>}
                </span>
                {week.map((cell, d) =>
                  cell ? (
                    <span
                      key={d}
                      title={`${dayLabel(cell.key)}: ${cell.count ? `${cell.count}개` : "기록 없음"}`}
                      className={`size-3 rounded-[3px] sm:size-[9px] sm:rounded-[2px] ${LEVEL_BG[level(cell.count)]}`}
                    />
                  ) : (
                    <span key={d} className="size-3 sm:size-[9px]" />
                  ),
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* 진하기 안내 (범례) */}
      <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-text-muted" aria-hidden="true">
        <span>적게</span>
        {LEVEL_BG.map((bg, i) => (
          <span key={i} className={`size-3 rounded-[3px] ${bg}`} />
        ))}
        <span>많이</span>
      </div>
    </figure>
  );
}

export function MonthlyBars({ stats }: { stats: ThinkingStats }) {
  const max = Math.max(1, ...stats.months.map((m) => m.count));
  return (
    <figure>
      <figcaption className="sr-only">
        최근 12개월 월별 기록: {stats.months.map((m) => `${m.label} ${m.count}개`).join(", ")}
      </figcaption>
      <div className="flex h-36 items-end gap-[2px] sm:gap-1" aria-hidden="true">
        {stats.months.map((m) => (
          <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${m.label}: ${m.count}개`}>
            {/* 값이 있는 달만 막대 위에 숫자 */}
            <span className={"text-[11px] tabular-nums " + (m.isCurrent ? "font-semibold text-text" : "text-text-muted")}>
              {m.count > 0 ? m.count : ""}
            </span>
            <span
              className={"w-full max-w-6 rounded-t-[4px] " + (m.isCurrent ? "bg-text" : "bg-[color-mix(in_oklab,var(--text)_45%,var(--surface))]")}
              style={{ height: `${m.count ? Math.max(4, (m.count / max) * 100) : 0}%` }}
            />
          </div>
        ))}
      </div>
      {/* 기준선 + 달 이름 */}
      <div className="border-t border-border" aria-hidden="true" />
      <div className="mt-1 flex gap-[2px] sm:gap-1" aria-hidden="true">
        {stats.months.map((m, i) => (
          <span
            key={m.key}
            className={"flex-1 text-center text-[10px] leading-tight " + (m.isCurrent ? "font-semibold text-text" : "text-text-muted")}
          >
            {/* 폰에서는 달 이름을 하나 걸러 표시 (겹치지 않게), 이번 달은 항상 */}
            <span className={i % 2 === 1 || m.isCurrent ? "" : "max-sm:invisible"}>{m.label.replace(/^\d+년 /, "")}</span>
          </span>
        ))}
      </div>
    </figure>
  );
}

export function TopTags({ stats }: { stats: ThinkingStats }) {
  if (stats.topTags.length === 0) return <p className="text-[15px] text-text-muted">아직 태그를 붙인 글이 없어요.</p>;
  const max = stats.topTags[0].count;
  return (
    <ol className="flex flex-col gap-1">
      {stats.topTags.map(({ tag, count }) => (
        <li key={tag}>
          {/* 누르면 그 태그가 붙은 글 목록으로 */}
          <Link
            href={`/?tag=${encodeURIComponent(tag)}`}
            className="-mx-2 grid min-h-11 grid-cols-[minmax(4rem,8rem)_1fr_auto] items-center gap-3 rounded-lg px-2 transition-colors hover:bg-surface"
          >
            <span className="truncate text-[15px] text-text">#{tag}</span>
            <span className="h-2 rounded-r-[4px] bg-[color-mix(in_oklab,var(--text)_45%,var(--surface))]" style={{ width: `${(count / max) * 100}%` }} aria-hidden="true" />
            <span className="text-sm text-text-muted tabular-nums">{count}개</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
