<div align="center">

<img src="docs/readme/icon.svg" width="96" height="96" alt="Nook 앱 아이콘">

<br><br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/logo-dark.svg">
  <img src="docs/readme/logo-light.svg" height="40" alt="Nook">
</picture>

<p>오늘의 생각을 다시 만나는 곳.<br>몇 줄로 정리해 둔 생각을 한 달 뒤, 1년 뒤 같은 날에 다시 꺼내 봅니다.</p>

<p><a href="https://nook-three-opal.vercel.app"><b>Nook 열기</b></a> &nbsp;|&nbsp; <a href="https://github.com/choitjddn0311/nook/releases/latest">최신 버전</a></p>

<br>

<img src="docs/readme/phone-home.png" width="250" alt="홈: 최신순 글 목록, 태그와 즐겨찾기로 거르기">&nbsp;
<img src="docs/readme/phone-post.png" width="250" alt="글 보기: Markdown 서식, 밤 테마">&nbsp;
<img src="docs/readme/phone-past.png" width="250" alt="지난 생각: 한 달 전, 6개월 전, 1년 전 오늘의 기록">

</div>

## 이런 앱이에요

일기는 써 두고 다시 펴 보지 않는 경우가 많습니다. Nook은 생각을 짧게 정리해 두고, 시간이 지나 다시 만나게 해 주는 개인 기록장입니다.
장식 없이 글이 주인공이고, 흑·백·회색만 쓰며, 쓰는 동안에는 방해하지 않습니다.

**쓰기**
- 제목 없이 본문만 써도 됩니다
- 쓰는 동안 자동으로 저장되고, 연결이 끊겨도 기기에 임시로 보관했다가 다시 연결되면 저장합니다
- 글마다 일반 글 또는 Markdown을 고를 수 있고, PC에서는 미리보기를 나란히 봅니다
- 태그, 글자 수·단어 수

**다시 꺼내 보기**
- 제목·본문 검색, 태그로 거르기, ★ 즐겨찾기
- **지난 생각**: 한 달 전, 6개월 전, 1년 전 같은 날에 쓴 기록
- **아무 글 보기**: 지난 글을 무작위로 한 편씩
- 지난 글 아래에 지금의 생각을 날짜와 함께 덧붙이기 (원래 글은 그대로)

**나**
- 전체 기록, 기록한 날, 연속 기록
- 1년 활동 달력, 월별 기록, 자주 쓴 태그
- 계정 관리: 비밀번호 바꾸기, 복구 코드 다시 만들기, 내 글 내보내기(Markdown·JSON), 탈퇴

<p align="center">
  <img src="docs/readme/desktop-markdown.png" width="49%" alt="PC: Markdown으로 쓰면서 오른쪽에서 미리보기">
  <img src="docs/readme/desktop-stats.png" width="49%" alt="PC: 마이페이지 생각 통계, 밤 테마">
</p>

## 설치하기

Nook은 웹앱(PWA)입니다. 앱 스토어 없이 홈 화면에 설치하면 일반 앱처럼 열립니다.

| 기기 | 방법 |
|---|---|
| iPhone · iPad | **Safari**로 열기 → 공유 버튼 → **홈 화면에 추가** |
| Android | **Chrome**으로 열기 → 오른쪽 위 ⋮ → **앱 설치** (또는 홈 화면에 추가) |
| Windows · Mac (Chrome, Edge) | 주소창 오른쪽의 **설치** 아이콘 → 설치 |
| Mac (Safari) | 메뉴 막대의 **파일 → Dock에 추가** |

## 가입하기

> 아직 **정식 공개 전**입니다. 가입 신청은 받지만, 운영자가 승인한 계정만 쓸 수 있습니다.

- **아이디·비밀번호** 또는 **Google**로 가입합니다. 이메일을 받지 않고 메일도 보내지 않습니다
- 아이디로 가입하면 **복구 코드**를 한 번 보여 줍니다. 비밀번호를 잊었을 때 이 코드로 직접 바꿉니다
- 승인을 기다리는 동안에는 대기 화면이 보이고, 승인되면 처음 한 번 사용법을 안내합니다

## 화면

- 폰, 태블릿, PC 어디서든 같은 기록을 이어서 씁니다
- **낮/밤 테마**: 처음엔 기기 설정을 따르고, 오른쪽 위 버튼으로 직접 바꾸면 기억합니다
- 키보드만으로 모든 기능을 쓸 수 있고, 글자 대비는 WCAG AA 기준을 지킵니다

## 개인정보와 보안

- 모든 기록은 **본인만 읽고 쓸 수 있습니다.** 데이터베이스 행 단위 보안(RLS)으로 다른 계정의 글에 접근할 수 없습니다
- Markdown 글 안의 HTML은 실행하지 않고, 위험한 링크는 막습니다
- 승인 전 계정은 데이터베이스가 직접 막습니다. 화면을 우회해도 글을 읽거나 쓸 수 없습니다
- 관리 화면에서는 계정 정보와 글 **개수**만 다루고, 글 내용은 볼 수 없습니다. 다만 글은 암호화해 저장하지 않으므로 데이터베이스 권한이 있는 운영자는 기술적으로 읽을 수 있습니다
- 앱에 비밀 키를 두지 않습니다. 브라우저에 공개되어도 되는 키만 쓰고, 권한은 데이터베이스 정책이 지킵니다
- 자세한 내용은 [개인정보 처리방침](https://nook-three-opal.vercel.app/privacy)과 [이용약관](https://nook-three-opal.vercel.app/terms)에 있습니다

## 직접 실행하기

개발하거나 자신의 Nook을 따로 띄우고 싶은 경우입니다.

**준비물**: Node.js 20.9 이상, [Supabase](https://supabase.com) 프로젝트

```bash
git clone https://github.com/choitjddn0311/nook.git
cd nook
npm install
```

프로젝트 루트에 `.env.local` 파일을 만들고 Supabase 프로젝트 값(Project Settings → API)을 넣습니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<프로젝트 ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable 키>
```

데이터베이스는 `supabase/migrations/`의 SQL을 **파일 이름 순서대로** 적용합니다 (Supabase SQL Editor 또는 `supabase db push`). 테이블과 RLS 정책이 함께 만들어집니다.

Supabase 대시보드 **Authentication → Sign In / Providers**에서 두 가지를 설정합니다.
- **Confirm email** 끄기 (아이디 가입은 메일을 보내지 않습니다)
- **Allow new users to sign up** 켜기 (가입을 받을 때만)

새 계정은 승인 대기로 만들어집니다. 처음 관리자는 가입한 뒤 SQL Editor에서 직접 지정합니다.

```sql
update public.profiles set is_admin = true, status = 'approved', approved_at = now()
where id = (select id from auth.users where email = '<관리자 이메일>');
```

그다음부터는 관리자 계정으로 로그인해 헤더의 **관리**에서 신청을 승인합니다.
Google 로그인을 쓰려면 Supabase의 Google 제공자 설정과 **URL Configuration**(Site URL, Redirect URLs)을 함께 맞춥니다.

```bash
npm run dev     # http://localhost:3000
npm run build   # 배포용 빌드 확인
```

**배포**: Vercel에 저장소를 연결하고 위 환경 변수 두 개를 넣으면 됩니다. 서버 지역은 Supabase 지역과 가깝게 맞추세요 (`vercel.json`의 `regions`).

## 문서

- [API 명세서](docs/api.md): 화면과 데이터 사이의 계약. HTTP 주소, 서버 동작, 데이터베이스 표·함수·권한, 알림 발송

## 만든 재료

| | |
|---|---|
| 프레임워크 | Next.js 16 (App Router), React, TypeScript |
| 스타일 | Tailwind CSS v4, Pretendard |
| 데이터·로그인 | Supabase (PostgreSQL, Auth, RLS) |
| Markdown | react-markdown, remark-gfm, remark-breaks |
| 배포 | Vercel |

## 버전 기록

바뀐 내용은 [Releases](https://github.com/choitjddn0311/nook/releases)에 있습니다.

## 라이선스

[MIT](LICENSE)
