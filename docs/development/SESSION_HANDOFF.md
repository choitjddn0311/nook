# Nook 인수인계 (HANDOFF)

> 지금 상태를 한 곳에. 주요 단계가 끝날 때마다 고친다(`docs/development/CONTEXT_GUIDE.md`).
> 기준: 2026-11-11, main 693776a (PR #51까지 병합)

## 1. 목적과 구조
- **Nook**: "오늘의 생각을 다시 만나는 곳". 짧게 정리한 생각을 한 달·6개월·1년 뒤 같은 날 다시 만나게 하는 개인 기록장(일기·메모). 원래 1인용 → 지금은 가입 신청 + 관리자 승인으로 여러 사람이 각자 공간으로 쓰는 구조(3차 공개 준비).
- 실제 주소: https://nook-three-opal.vercel.app · 저장소: github.com/choitjddn0311/nook (**공개**) · 설명은 한국어로, 초중급 개발자가 이해할 수 있게
- 구조
  - `src/app/` 화면(App Router): `/` (로그인 전 랜딩 `/welcome`을 rewrite, 로그인 후 내 글), `/write`, `/posts/[id]`(+`/edit`), `/past`, `/random`, `/me`(+`/me/export`), `/admin`(+`/signups` `/inquiries` `/accounts` `/me`, 관리자 전용 틀 `src/app/admin/layout.tsx`), `/waiting`, `/login` `/signup` `/recover` `/auth/callback`, `/privacy` `/terms` `/contact/sent`
  - `src/proxy.ts` → `src/lib/supabase/proxy.ts`: 로그인·승인 안내(잠금은 DB가 함)
  - `src/lib/` 공용 로직, `src/components/` 화면 조각
  - `supabase/migrations/` (16개, 파일 이름 = 실제 적용 번호), `supabase/functions/` Edge Function 2개(`send-notifications`, `cleanup-orphan-images`)
  - 문서: `CLAUDE.md`(개요·핵심 규칙, 45줄), 필요할 때만 `docs/design.md`(디자인·접근성), `docs/architecture.md`(스택·데이터·보안), `docs/api.md`(API 명세서), `docs/roadmap.md`(단계·남은 과제) — PR #45에서 분리

## 2. 기술 스택
- Next.js 16.4 App Router + TypeScript + Tailwind v4, React 19. `cacheComponents` 켜짐(요청 데이터는 Suspense 안), `refresh()`(next/cache)로 서버 동작 뒤 다시 그림
- Supabase(eu-west-1): Auth, Postgres + RLS, Storage, pg_cron, pg_net, Vault, Edge Functions(Deno). 앱에는 **공개 키만**, 비밀 키 없음
- Vercel Hobby(dub1), `main` 병합 = 자동 배포, PR마다 미리보기
- 웹 푸시: `@negrel/webpush`(Edge Function), 서비스워커 `public/sw.js`(알림만, 캐시 없음)
- Markdown: react-markdown + remark-gfm + remark-breaks, 폰트 Pretendard 하나
- 도구: Playwright MCP(화면 시험), Supabase MCP(SQL·마이그레이션), Context7(문서), Supabase CLI(`npx supabase@latest`, 터미널에서 로그인 필요, 변경은 `--yes`)

## 3. 구현 완료 기능 (1~21단계 + 21.5 일부, PR #1~#51)
- 글: 제목 선택·본문, 자동 저장(+오프라인 기기 임시본), 일반/Markdown, 태그, 즐겨찾기, 검색, 글자 수
- 다시 보기: 지난 생각(한 달·6개월·n년 전 오늘), 아무 글 보기, 덧붙인 생각(원글은 그대로)
- 마이페이지: 생각 통계(활동 달력·월별·태그), 계정 관리(비밀번호, 복구 코드, 내보내기 md/json, 탈퇴), **알림**
- 가입·로그인: 아이디(+복구 코드, 내부 이메일 `<id>@users.nook.invalid`) / Google / 기존 이메일 로그인. 메일 안 보냄. 관리자 승인 전엔 `/waiting`
- 사용법 안내(승인 후 처음 한 번), 랜딩(실제 화면 사진, FAQ 5개, 문의하기 → `/contact/sent`)
- 관리자 대시보드(#51 리디자인): PC 왼쪽 사이드바 / 폰 위 줄 + 아래 아이콘 탭(배지). `/admin` 개요(숫자 카드·미리보기·14일 가입 막대) · `/admin/signups` · `/admin/inquiries`(답장하기·완료·삭제) · `/admin/accounts`(표·검색·상태 거르기, 글·사진 **개수만**) · `/admin/me`(비밀번호·복구 코드·로그아웃). 시안: Artifact 캔버스 https://claude.ai/artifact/CYgn2DR6fZN8YCanEgEcaw
- **관리자 계정은 대시보드 전용**(#50): 토큰 claim `is_admin` → proxy가 `/admin`(과 처리방침·약관)만 열어 줌, 로그인하면 바로 `/admin`, 헤더 링크 없음, `/me` 없음. 글쓰기를 DB에서 막지는 않음
- 처리방침·약관(동의 버전 기록), 링크 미리보기(`public/og.png`), SEO(robots, sitemap, Google Search Console HTML 파일 확인 `public/googlecbde0de40ebe2e84.html`)
- **알림(웹 푸시)**: 지난 오늘 알림 + 글쓰기 알림(매일/매주), 시각 1시간 단위 사용자 지정(`notification_settings`, 기본 지난 오늘 9시·글쓰기 꺼짐), 매시 정각 cron → `send-notifications`. 기기마다 켜기, 로그아웃 때 연결 삭제. **글 완료 뒤 안내 창**(#44, 나중에 → 7일 뒤 1회, 2번이면 끝)
- **사진 첨부**(#42): 글당 10장·계정당 200장·2MB, 기기에서 2000px WebP로 줄이며 EXIF(위치) 제거, 비공개 버킷 `post-images` + 1시간 서명 주소, 설명(alt) 선택, 글 삭제·사진 빼기·탈퇴 때 파일 바로 삭제, 남은 파일은 매일 KST 4:30 `cleanup-orphan-images`
- API 명세서 `docs/api.md` (서버 동작 25, DB 함수 20, 표 8, Edge Function 2, 예약 작업 3)
- **속도 개선**(#47, #48): proxy(Vercel 서울 `icn1`)가 매 요청 아일랜드 DB에 승인 여부를 묻던 것(0.3~0.9초)을 토큰 claim `account_status`로 대체(DB 훅 `custom_access_token_hook`, 대시보드 Authentication → Hooks에서 켬. 문제 생기면 끄면 원래대로). 목록 미리보기는 서버에서 200자로 자름, `getAccount`는 React `cache()`로 요청당 한 번

## 4. 현재 진행 중
- PR #49(이 문서 갱신) 병합 대기. 그 밖의 작업은 모두 병합됨(마지막 #51)
- 저장소에 커밋하지 않은 로컬 파일: `.claude/settings.json`(플러그인 설치로 바뀜), `.claude/skills/`, `design/logo.ai`, `skills-lock.json` — 넣을지 사용자 결정 필요

## 4.1 2026-11-11 세션 기록

**완료한 작업** (모두 병합)
| PR | 내용 |
|---|---|
| #46 | 인수인계 문서 이름 `HANDOFF.md` → `SESSION_HANDOFF.md`, Mac 알림·아이폰 사진 확인 결과 반영 |
| #47 | 속도: proxy의 매 요청 `profiles` 조회 제거 → 토큰 claim `account_status` (DB 훅 `custom_access_token_hook`, 마이그레이션 `20261111010053`) |
| #48 | 속도: 목록 미리보기 서버에서 200자로 자름, `getAccount` React `cache()` |
| #50 | 관리자 계정은 대시보드 전용: 훅에 `is_admin` claim(`20261111082212`), proxy·로그인 동작이 관리자를 `/admin`으로, 헤더 `AdminLink` 삭제 |
| #51 | 관리 대시보드 리디자인: PC 사이드바 / 폰 아래 탭, `/admin` 아래 5화면, 계정 표, 문의 시각 hydration 버그 수정 |

**변경한 파일과 주요 변경 사항**
- `src/lib/supabase/proxy.ts`: 토큰 claim으로 승인·관리자 판단, 관리자는 `/admin`·`/admin/*`만
- `src/app/login/actions.ts`: 관리자 → `/admin`
- `src/app/admin/layout.tsx`(새), `src/components/admin-nav.tsx`(새), `src/components/admin-ui.tsx`(새): 관리 화면 틀·메뉴·공용 모양
- `src/app/admin/page.tsx`(개요로 다시 씀), `src/app/admin/{signups,inquiries,accounts,me}/page.tsx`(새)
- `src/components/account-list.tsx`(검색 + 상태 거르기 + PC 표 머리줄), `src/components/signup-row.tsx`(PC 표 칸, 상태 점, 버튼 문구), `src/components/inquiry-row.tsx`(시각을 `formatPostDate`·`formatPostTime`으로)
- `src/app/layout.tsx`·`src/components/site-header.tsx`: `data-admin`이 있으면 일반 헤더 숨김·본문 폭 제한 해제(`group-has`)
- `src/lib/admin.ts`(목록 함수 `cache()`), `src/lib/account.ts`(`getAccount` `cache()`), `src/lib/stats.ts`(`dailyCounts`), `src/lib/format.ts`(미리보기 200자 `clip`)
- `supabase/migrations/20261111010053_access_token_status_claim.sql`, `20261111082212_access_token_admin_claim.sql`
- 문서: `docs/api.md`, `docs/architecture.md`, `docs/design.md`(관리 화면 예외), `CLAUDE.md`·`CONTEXT_GUIDE.md`(문서 이름)

**중요한 설계 결정**
- 속도 원인은 proxy(서울) ↔ DB(아일랜드) 왕복이었다. Supabase 서울 이전은 큰 작업이라 보류하고, 토큰 claim으로 왕복을 없앴다
- 거절 전환은 토큰이 새로 발급될 때까지(최대 1시간) 화면 안내가 늦다. 잠금은 RLS가 바로 하므로 받아들였다
- 관리자 글쓰기는 DB에서 막지 않는다(운영자 본인 계정, 화면에서만 막음)
- 관리 화면만 디자인 예외(사이드바·숫자 카드·표). 시안: PC는 A, 폰은 C의 아래 탭 + B의 화면(Artifact 캔버스 확정안 줄)
- DB 변경 없이 갈 수 있는 것만 넣었다: 글·사진 날짜별 증감, 계정 표 정렬·쪽 나누기는 뺌(`shortcut:` 주석)

**테스트한 항목과 결과** (로컬 개발 서버 + 운영 DB의 시험 계정, 시험 데이터는 모두 삭제)
- tsc · lint · build: 각 PR에서 통과
- 훅: 프로필 없는 사용자도 `pending`/`false`로 발급됨(SQL 직접 호출)
- 승인 흐름: 가입 직후 토큰 `pending` → `/waiting`, SQL 승인 후 새로 고침 → 토큰 `approved`로 갱신·홈 이동
- 관리자: 로그인 → `/admin`, 일반 화면 6곳 → `/admin`, 처리방침 열림, 비밀번호 바꾸기(새 비밀번호로 재로그인)·복구 코드·로그아웃 동작
- 대시보드: 승인 → 목록·배지 즉시 갱신, 문의 답장 완료 → 배지 갱신, 계정 검색·상태 거르기, 가로 넘침·콘솔 오류 없음. 화면 확인: 5화면 375/1280 낮, 개요·계정은 375/768/1280 × 낮/밤
- 일반 사용자: 헤더·홈 그대로, `/admin/*`는 없는 페이지
- 미리보기 자르기: 500자 → 200자, 이모지 깨짐 없음. `dailyCounts`: 한국 자정 경계·14일 범위 확인
- 사용자 확인: 속도 개선 뒤 실제 사이트에서 "체감될 정도로 빨라졌다"
- **확인 안 함**: #50·#51의 실제 사이트 동작, 실제 폰(아이폰·안드로이드)에서 관리 화면 아래 탭

## 5. 설계 결정과 규칙 (핵심은 CLAUDE.md, 세부는 docs/*.md)
- 작업 흐름: 브랜치 → PR → 검증 → **사용자가 "병합"이라고 해야** 병합. DB 구조 변경은 **SQL을 먼저 보여 주고 확인**. 큰 작업은 계획 먼저. 설명은 한국어, 쉽게
- UI 고치면 Playwright로 375/1280 × 낮/밤 확인. 시험은 가짜 계정(`qa_*` 아이디로 가입 → SQL로 승인 → 끝나면 `delete from auth.users`)
- 디자인: 모노크롬(포인트 색 없음, 토큰만), Pretendard, 장식 없음, 네이티브 `<dialog>`
- 보안: 모든 표 RLS + `is_approved()` restrictive, 관리 기능은 security definer 함수로만, **관리자도 글·사진 내용은 볼 수 없음(개수만)**. 이메일 든 SQL은 마이그레이션에 넣지 않음(공개 저장소). 비밀 값 예외: VAPID 개인 키(`VAPID_KEYS`, Edge Function 비밀 값), cron 비밀 값(Vault `push_cron_secret`, 밖으로 안 꺼냄)
- Storage 파일은 SQL로 못 지움 → Storage API로 지우고 정리 함수가 보완
- 서버 동작·라우트·DB 함수·Edge Function을 바꾸면 **같은 PR에서 `docs/api.md`도** 고친다. 개인정보 처리가 바뀌면 처리방침과 시행일(`src/lib/legal.ts`)도
- 마이그레이션은 MCP로 적용한 뒤 파일 이름을 실제 적용 번호로 바꾼다(운영 DB 적용은 자동 모드가 막으므로 사용자가 "적용"이라고 한 뒤 실행)
- **시안은 Artifact(Design 캔버스)로** 만들고, 코드를 고치기 전에 확인받는다(2026-11-11 사용자 요청)
- 승인 여부·관리자 여부는 **토큰 claim**(`account_status`, `is_admin`)으로 판단한다. proxy는 서울에서 돌아서 DB 왕복이 비싸다. 토큰에 표시가 없을 때만 DB를 읽는다
- 서버 동작의 `redirect()`는 proxy를 거치지 않는다 → 역할별 첫 화면(관리자 → `/admin`)은 로그인 동작에서 직접 정한다
- 주의(함정): React 19 폼 액션은 끝나면 폼을 되돌림(바로 저장 UI는 객체로 서버 동작 호출), 개발 모드 effect 두 번 실행, 375px에서 Next 개발 배지가 왼쪽 아래 버튼을 가림(배포본엔 없음), `"use server"` 파일은 async 함수만 export, 강제 푸시는 자동 모드가 막음(충돌은 merge로 해결)

## 6. 해결되지 않은 문제 / 미확인
- 실제 폰에서 아직 안 해 본 것: 안내 창에서 '알림 켜기' → 권한 → 구독
- 관리자 전용(#50)·대시보드 리디자인(#51)을 **실제 사이트에서는 아직 확인 안 함**(로컬 개발 서버 + 시험 계정으로만 확인). 기존 관리자 계정은 로그아웃 → 로그인해야 토큰에 `is_admin`이 들어감
- 승인 → 거절로 바뀐 계정은 토큰이 새로 발급될 때까지(최대 1시간) `/waiting` 안내가 늦음(데이터는 RLS가 바로 막음)
- (해결, 2026-11-11) Mac PC Chrome 푸시 알림 도착 확인 → 아이폰·안드로이드·Mac 모두 정상. 아이폰 사진 올리기도 실기기에서 정상
- `cleanup-orphan-images`가 실제 고아 파일을 지우는 것(1시간 지난 파일만 대상이라 미시험)
- Supabase **Allow new users to sign up이 켜져 있음**(실제 사람들이 가입·승인돼 있음). 출시 전이라 끌지 사용자 결정 대기
- Google Search Console: 확인 파일은 배포됨, 사용자가 '확인'·사이트맵 제출을 했는지 모름. 네이버는 안 하기로 함
- 내보내기에 사진 파일(zip)은 없음(정보만)
- 법·운영 과제(21.5) 대부분 미결: 법률 검토, 접속기록 보관, 거절 계정 30일 삭제 방법, 글 열람 약속, 유출 대응, 위탁 정보 확인, 시행일을 실제 공개일로

## 7. 다음 작업 후보
0. 실제 사이트에서 관리자 계정으로 로그아웃 → 로그인 → 새 대시보드(PC·폰) 확인 받기, 문제 있으면 수정
   - 선택: 관리 개요에 글·사진 날짜별 증감(DB 함수 필요), 계정 표 정렬·쪽 나누기(계정이 많아지면)
1. 폰에서 알림 안내 창('알림 켜기' → 구독) 실제 확인 결과 받기, 문제 있으면 수정
2. 21.5 법·운영 과제 (대부분 사용자 결정) — docs/roadmap.md 21.5 표
3. 선택: 사용법 다시 보기, 카카오 로그인(보류), 사진 묶음 내보내기(zip)
   - 속도: 기본 지연(한국 ↔ 더블린 화면 서버)은 Supabase 서울 이전 말고는 못 줄임 → 보류
4. 도메인 구입(사용자 결정: 가장 마지막) → `src/lib/site.ts` SITE_URL, Supabase·Google 주소, Search Console 재등록, 알림 다시 켜기
5. 22단계: 두 계정 교차 점검 → 가입 켜기 → 1.1.0 릴리스 (출시는 사용자가 "아직"이라고 보류)
