import Link from "next/link";

// 6단계(글 목록)에서 실제 목록으로 바뀌는 자리. 지금은 글이 없을 때의 화면.
export default function Home() {
  return (
    <>
      <section className="flex flex-1 flex-col justify-center py-16">
        <p className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">아직 적어 둔 글이 없어요.</p>
        <p className="mt-3 text-base leading-relaxed text-text-muted">
          떠오른 생각, 오늘 있었던 일, 잊고 싶지 않은 문장을 이곳에 하나씩 모아 두세요.
        </p>
      </section>

      {/* 하단 고정: 폰에서 엄지가 닿는 곳 */}
      <div className="sticky bottom-0 -mx-4 flex justify-end bg-bg px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6">
        <Link
          href="/write"
          className="inline-flex h-12 items-center rounded-lg bg-accent px-6 text-base font-semibold text-accent-contrast transition-transform duration-100 ease-out active:scale-[0.98]"
        >
          새 글 쓰기
        </Link>
      </div>
    </>
  );
}
