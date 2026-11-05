import Link from "next/link";

// 없는 주소·지워진 글·남의 글일 때 (Next 기본 404 대신 Nook 화면으로)
export default function NotFound() {
  return (
    <section className="flex flex-1 flex-col justify-center py-16">
      <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-text">찾는 글이 없어요.</h1>
      <p className="mt-3 text-base leading-relaxed text-text-muted">지워졌거나 주소가 바뀌었을 수 있어요.</p>
      <Link href="/" className="mt-6 self-start text-base text-text underline underline-offset-4">
        목록으로 돌아가기
      </Link>
    </section>
  );
}
