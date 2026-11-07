import type { Metadata } from "next";
import { Suspense } from "react";
import { LogoutButton } from "@/components/logout-button";
import { SkeletonBar, SkeletonGroup } from "@/components/skeleton";
import { ActivityCalendar, MonthlyBars, StatNumbers, TopTags } from "@/components/thinking-stats";
import { computeStats, seoulDayKey } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { accountName } from "@/lib/username";

export const metadata: Metadata = { title: "나 · Nook" };

// 마이페이지: 나(계정) → 생각 통계 → 로그아웃
export default function MePage() {
  return (
    <div className="flex flex-1 flex-col pt-4 pb-10">
      <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">나</h1>
      {/* 로그인 정보와 글을 읽어야 해서 요청 때 그린다 (Cache Components) */}
      <Suspense fallback={<MeSkeleton />}>
        <MeContent />
      </Suspense>
      <LogoutButton className="mt-12 border-t border-border pt-4" />
    </div>
  );
}

async function MeContent() {
  const supabase = await createClient();
  const [{ data: userData }, { data: posts }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("posts").select("created_at, tags").order("created_at", { ascending: true }),
  ]);
  const user = userData.user;
  const stats = computeStats(posts ?? []);

  // 함께한 날: 가입한 날을 1일째로 (한국 날짜 기준)
  const joined = user?.created_at ? seoulDayKey(new Date(user.created_at)) : null;
  const today = seoulDayKey(new Date());
  const daysTogether = joined ? Math.round((Date.parse(today) - Date.parse(joined)) / 86_400_000) + 1 : null;
  const [jy, jm, jd] = (joined ?? "").split("-").map(Number);

  return (
    <>
      {/* ① 나 */}
      <section aria-labelledby="me-account" className="mt-2">
        <h2 id="me-account" className="sr-only">
          내 계정
        </h2>
        <p className="text-base text-text-muted">{accountName(user?.email)}</p>
        {joined && (
          <p className="mt-1 text-[15px] text-text-muted">
            {jy}년 {jm}월 {jd}일에 시작해서, Nook과 함께한 지 <span className="font-semibold text-text">{daysTogether}일째</span>예요.
          </p>
        )}
      </section>

      {/* ② 생각 통계 */}
      <section aria-labelledby="me-stats" className="mt-10">
        <h2 id="me-stats" className="text-lg leading-snug font-semibold tracking-[-0.01em] text-text">
          생각 통계
        </h2>
        {stats.total === 0 ? (
          <p className="mt-3 text-base leading-relaxed text-text-muted">아직 기록이 없어요. 첫 글을 쓰면 여기에 쌓여요.</p>
        ) : (
          <>
            <div className="mt-2">
              <StatNumbers stats={stats} />
            </div>
            <h3 className="mt-8 mb-3 text-[15px] font-semibold text-text">최근 1년</h3>
            <ActivityCalendar stats={stats} />
            <h3 className="mt-8 mb-3 text-[15px] font-semibold text-text">월별 기록</h3>
            <MonthlyBars stats={stats} />
            <h3 className="mt-8 mb-2 text-[15px] font-semibold text-text">자주 쓴 태그</h3>
            <TopTags stats={stats} />
          </>
        )}
      </section>
    </>
  );
}

function MeSkeleton() {
  return (
    <SkeletonGroup label="내 기록을 불러오는 중" className="mt-3 flex flex-col gap-3">
      <SkeletonBar className="h-4 w-48" />
      <SkeletonBar className="h-4 w-64" />
      <SkeletonBar className="mt-8 h-5 w-24" />
      <SkeletonBar className="h-10 w-full" />
      <SkeletonBar className="h-10 w-full" />
    </SkeletonGroup>
  );
}
