import type { Metadata } from "next";
import Link from "next/link";
import { BottomBar } from "@/components/bottom-bar";
import { LandingShot } from "@/components/landing-shot";
import { LegalLinks } from "@/components/legal-document";
import { NookLogo } from "@/components/nook-logo";
import { primaryButton, secondaryButton } from "@/lib/button-styles";
import { OPERATOR } from "@/lib/legal";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

// 실제 주소는 / (proxy가 로그인 안 한 사람에게 이 화면을 보여 준다) → 검색 엔진에도 /로 알린다
export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

// 로그인 전 첫 화면(랜딩). 주소는 / 이고, proxy가 로그인 안 한 사람만 이 화면으로 돌려 보여 준다.
// 말하려는 것: 일기는 쓰고 나면 다시 안 보게 된다. Nook은 짧게 정리한 생각을 다시 꺼내 준다.
// 넓은 화면(lg 이상)에서는 .landing이 헤더와 본문 폭을 넓힌다 (globals.css).

const ABSENT = ["피드", "좋아요", "팔로워", "댓글", "광고"];

const DIFFERENT = [
  ["다른 사람에게 보이지 않아요", "내 글은 내 계정에서만 열려요. 다른 사용자는 볼 수 없고, 관리 화면에도 글은 나오지 않아요."],
  ["이메일이 필요 없어요", "아이디와 비밀번호로 가입해요. 비밀번호를 잊으면 가입할 때 받은 복구 코드로 다시 정해요."],
  ["지난 글을 고치지 않아요", "그때의 글은 그대로 두고, 지금의 생각을 날짜와 함께 아래에 덧붙여요."],
  ["어디서나 같은 글이에요", "폰, 태블릿, PC 브라우저에서 바로 열고, 홈 화면에 앱처럼 설치할 수 있어요."],
];

function Actions({ className = "" }: { className?: string }) {
  return (
    <div className={`gap-2 ${className}`}>
      <Link href="/signup" className={primaryButton}>
        시작하기
      </Link>
      <Link href="/login" className={secondaryButton}>
        로그인
      </Link>
    </div>
  );
}

const h2Class = "text-3xl leading-tight font-semibold tracking-[-0.02em] text-balance text-text sm:text-4xl lg:text-5xl";
const h3Class = "text-xl leading-snug font-semibold tracking-[-0.01em] text-text lg:text-2xl";
const bodyClass = "mt-2 text-base leading-relaxed text-text-muted lg:mt-3 lg:text-lg";
// 기능 한 줄: 넓은 화면에서 설명과 사진을 나란히
const rowClass = "grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-center lg:gap-16";
// 사진이 왼쪽에 오는 줄: 넓은 칸이 사진 쪽으로 가도록 칸 순서도 바꾼다
const rowReverseClass = "grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-16";

export default function WelcomePage() {
  return (
    <div className="landing flex flex-1 flex-col">
      {/* 첫 화면 */}
      <section className="pt-12 sm:pt-20 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center lg:gap-12 lg:pt-10">
        <div>
          <h1 className="text-[2.125rem] leading-[1.15] font-semibold tracking-[-0.02em] text-text sm:text-6xl lg:text-[3.25rem] xl:text-6xl">
            오늘의 생각을
            <br />
            다시 만나는 곳, Nook.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-text-muted lg:mt-7 lg:max-w-lg lg:text-xl">
            오늘 생각을 몇 줄로 정리해 두면, 한 달 뒤, 6개월 뒤, 1년 뒤 같은 날에 다시 만나요.
          </p>
          <Actions className="mt-7 hidden sm:flex lg:mt-9" />
        </div>

        <div className="mt-12 sm:mt-16 lg:mt-0">
          <LandingShot
            name="home"
            alt="Nook 홈 화면. 맨 위에 '지난 오늘 쓴 글이 3개 있어요' 안내가 있고, 그 아래로 글 목록이 보입니다."
            sizes="(min-width: 640px) 320px, 75vw"
            eager
            className="w-[78%] max-w-80 lg:ml-auto lg:w-full"
          />
        </div>
      </section>

      {/* 방향성 */}
      <section className="pt-20 sm:pt-28 lg:grid lg:grid-cols-2 lg:gap-16 lg:pt-40">
        <h2 className={h2Class}>길게 쓰지 않아도, 다시 읽게 돼요.</h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-text-muted lg:mt-0 lg:text-xl">
          일기는 다짐하고 길게 쓰다가, 덮고 나면 다시 펼치지 않게 되곤 해요. Nook은 제목 없이 몇 줄이면 충분하고, 지난 오늘의 글은 홈에서 먼저 알려 줘요.
        </p>
      </section>

      {/* 기능과 실제 화면. 차별점인 지난 생각을 맨 앞에 */}
      <section aria-label="기능" className="flex flex-col gap-16 pt-20 sm:gap-24 sm:pt-28 lg:gap-32 lg:pt-32">
        <div className={rowClass}>
          <div>
            <h3 className={h3Class}>1년 전 오늘의 내가 돌아와요</h3>
            <p className={bodyClass}>
              한 달 전, 6개월 전, 1년 전 같은 날에 쓴 글을 모아 보여 줘요. 다시 읽고 든 생각은 그 글 아래에 덧붙이면 돼요.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <LandingShot name="past" alt="지난 생각 화면. 한 달 전, 6개월 전, 1년 전 오늘 쓴 글이 차례로 보입니다." sizes="(min-width: 1024px) 340px, (min-width: 672px) 300px, 46vw" />
            <LandingShot name="note" alt="1년 전에 쓴 글과 그 아래에 오늘 덧붙인 생각이 보이는 화면입니다." sizes="(min-width: 1024px) 340px, (min-width: 672px) 300px, 46vw" />
          </div>
        </div>

        <div className={rowReverseClass}>
          <div className="lg:order-2">
            <h3 className={h3Class}>몇 줄이면 충분해요</h3>
            <p className={bodyClass}>
              제목은 없어도 되고 저장 버튼도 없어요. 인터넷이 끊겨도 기기에 남아 있다가 연결되면 저장돼요. 글마다 일반 글과 Markdown 중에 고를 수 있어요.
            </p>
          </div>
          <LandingShot
            name="markdown"
            alt="글쓰기 화면. 왼쪽에 Markdown 원문, 오른쪽에 서식이 적용된 미리보기가 나란히 보입니다."
            sizes="(min-width: 1024px) 720px, (min-width: 672px) 624px, 100vw"
            className="lg:order-1"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-[1fr_16rem] sm:items-center sm:gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-16">
          <div>
            <h3 className={h3Class}>쌓인 생각을 다시 꺼내요</h3>
            <p className={bodyClass}>
              제목과 본문으로 찾고, 태그로 거르고, 아끼는 글에는 별을 달아 두세요. 무엇을 읽을지 모르겠다면 아무 글이나 한 편 꺼내 볼 수 있어요.
            </p>
          </div>
          <LandingShot
            name="tag"
            alt="산책 태그로 거른 글 목록 화면입니다."
            sizes="(min-width: 1024px) 340px, (min-width: 640px) 256px, 75vw"
            className="w-[78%] sm:w-full lg:max-w-85"
          />
        </div>

        <div className={rowReverseClass}>
          <div className="lg:order-2">
            <h3 className={h3Class}>얼마나 적어 왔는지 돌아봐요</h3>
            <p className={bodyClass}>기록한 날, 연속 기록, 1년 활동 달력과 월별 기록을 나만 볼 수 있어요.</p>
          </div>
          <LandingShot
            name="stats"
            alt="생각 통계 화면. 기록 수, 연속 기록, 1년 활동 달력, 월별 막대그래프가 보입니다."
            sizes="(min-width: 1024px) 720px, (min-width: 672px) 624px, 100vw"
            className="lg:order-1"
          />
        </div>
      </section>

      {/* 차별된 점: 없는 것을 먼저 */}
      <section className="pt-20 sm:pt-28 lg:grid lg:grid-cols-2 lg:gap-16 lg:pt-40">
        <div>
          <h2 className={h2Class}>Nook에는 없는 것</h2>
          <ul className="mt-6 flex flex-col lg:mt-8">
            {ABSENT.map((item) => (
              <li
                key={item}
                className="text-5xl leading-[1.25] font-semibold tracking-[-0.02em] text-text-muted line-through decoration-2 sm:text-6xl lg:text-7xl"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 sm:mt-20 lg:mt-0">
          <h2 className={h2Class}>그래서 남은 것</h2>
          <dl className="mt-6 divide-y divide-border lg:mt-8">
            {DIFFERENT.map(([name, text]) => (
              <div key={name} className="py-5">
                <dt className="text-lg leading-snug font-semibold tracking-[-0.01em] text-text">{name}</dt>
                <dd className="mt-1 text-base leading-relaxed text-text-muted">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 마지막 권유 */}
      <section className="py-20 sm:py-28 lg:py-40">
        <h2 className={`${h2Class} lg:text-6xl`}>오늘 생각을 한 줄만 적어 보세요.</h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-text-muted lg:text-lg">
          지금은 한 분씩 천천히 맞이하고 있어요. 가입한 뒤 승인되면 바로 시작할 수 있어요.
        </p>
        <Actions className="mt-7 hidden sm:flex" />
      </section>

      {/* 폰에서는 엄지가 닿는 자리에 항상 */}
      <BottomBar className="flex items-center gap-2 sm:hidden">
        <Link href="/login" className={`${secondaryButton} flex-1`}>
          로그인
        </Link>
        <Link href="/signup" className={`${primaryButton} flex-1`}>
          시작하기
        </Link>
      </BottomBar>

      <footer className="mt-auto border-t border-border pt-8 pb-10 text-sm text-text-muted lg:flex lg:items-start lg:justify-between lg:gap-12">
        <div>
          <NookLogo className="h-4 w-auto text-text" />
          <p className="mt-3">운영자 {OPERATOR.name}</p>
          <p className="mt-1">
            문의{" "}
            <a href={`mailto:${OPERATOR.email}`} className="underline underline-offset-4">
              {OPERATOR.email}
            </a>
          </p>
          <p className="mt-3">© 2026 Nook</p>
        </div>
        <LegalLinks className="mt-4 lg:mt-0" />
      </footer>
    </div>
  );
}
