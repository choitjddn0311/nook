import type { Metadata } from "next";
import Link from "next/link";
import { BottomBar } from "@/components/bottom-bar";
import { primaryButton, secondaryButton } from "@/lib/button-styles";

export const metadata: Metadata = {
  title: "Nook",
  description: "나만의 작은 구석. 일기, 아이디어, 메모를 조용히 적어 두고 다시 꺼내 보는 공간.",
};

// 로그인 전 첫 화면(랜딩). 주소는 / 이고, proxy가 로그인 안 한 사람만 이 화면으로 돌려 보여 준다.
// 스크린샷 대신 실제 글자로 된 예시 글을 둔다: 낮/밤을 그대로 따르고, 이 앱의 주인공이 글이라는 걸 그대로 보여 준다.
const WHAT = [
  ["쓰기", "제목 없이 본문만 써도 돼요. 쓰는 동안 저절로 저장되고, 원하면 글마다 Markdown으로 쓸 수 있어요."],
  ["다시 꺼내기", "제목과 본문으로 찾고, 태그로 거르고, 아끼는 글에는 별을 달아 두세요. 아무 글이나 한 편 꺼내 볼 수도 있어요."],
  ["지난 생각", "한 달 전, 6개월 전, 1년 전 오늘 쓴 글을 다시 만나요. 원래 글은 그대로 두고 지금의 생각을 아래에 덧붙여요."],
  ["쌓인 기록", "기록한 날, 연속 기록, 1년 활동 달력으로 내가 얼마나 적어 왔는지 조용히 돌아봐요."],
];

export default function WelcomePage() {
  return (
    <>
      <section className="pt-14 pb-12 sm:pt-20">
        <h1 className="text-[2.5rem] leading-[1.1] font-semibold tracking-[-0.02em] text-text sm:text-5xl">
          나만의
          <br />
          작은 구석.
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-text-muted">
          일기, 아이디어, 메모를 조용히 적어 두고, 잊을 만할 때 다시 꺼내 보는 곳이에요.
        </p>
      </section>

      {/* 예시 글: 실제 글 보기 화면과 같은 글자 위계 */}
      <figure className="border-y border-border py-8" aria-label="Nook에 쓴 글의 예시">
        <p className="text-sm text-text-muted">11월 6일 (금)</p>
        <p className="mt-2 text-xl leading-snug font-semibold tracking-[-0.01em] text-text">비 오는 아침</p>
        <p className="mt-3 text-base leading-relaxed text-text">
          창문에 맺힌 물방울을 한참 봤다.
          <br />
          오늘은 천천히 가도 괜찮다고, 스스로에게 말해 주었다.
        </p>
        <p className="mt-6 text-sm text-text-muted">1년 뒤에 덧붙인 생각</p>
        <p className="mt-1 text-base leading-relaxed text-text-muted">그날의 나에게 고맙다. 지금도 천천히 가고 있다.</p>
      </figure>

      <dl className="flex flex-col gap-8 py-12">
        {WHAT.map(([name, text]) => (
          <div key={name}>
            <dt className="text-lg font-semibold tracking-[-0.01em] text-text">{name}</dt>
            <dd className="mt-1 text-base leading-relaxed text-text-muted">{text}</dd>
          </div>
        ))}
      </dl>

      <section className="border-t border-border py-12">
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-text">내 글은 나만 봐요</h2>
        <p className="mt-1 text-base leading-relaxed text-text-muted">
          다른 사용자는 내 글을 볼 수 없고, 관리 화면에도 글은 나오지 않아요. 이메일 없이 아이디만으로 가입해요.
        </p>
        <p className="mt-4 text-base leading-relaxed text-text-muted">
          지금은 한 분씩 천천히 맞이하고 있어서, 가입한 뒤 승인을 받으면 시작할 수 있어요.
        </p>
      </section>

      {/* 폰에서 엄지가 닿는 자리 */}
      <BottomBar className="mt-auto flex items-center gap-2">
        <Link href="/login" className={`${secondaryButton} flex-1`}>
          로그인
        </Link>
        <Link href="/signup" className={`${primaryButton} flex-1`}>
          시작하기
        </Link>
      </BottomBar>
    </>
  );
}
