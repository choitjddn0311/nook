// 6단계(글 목록)에서 실제 목록으로 바뀌는 자리. 지금은 글이 없을 때의 화면.
export default function Home() {
  return (
    <section className="flex flex-1 flex-col justify-center py-16">
      <p className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">아직 적어 둔 글이 없어요.</p>
      <p className="mt-3 text-base leading-relaxed text-text-muted">
        떠오른 생각, 오늘 있었던 일, 잊고 싶지 않은 문장을 이곳에 하나씩 모아 두세요.
      </p>
    </section>
  );
}
