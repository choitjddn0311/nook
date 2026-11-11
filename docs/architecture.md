# Nook 구조·데이터·보안 세부

> 서버 동작, DB, 인증, 파일 저장, 알림을 건드릴 때 읽는다. 함수·표·권한의 정확한 계약은 `docs/api.md`.

## 기술 스택
- Next.js (App Router) + TypeScript
- Tailwind CSS (색상은 위 토큰과 연결)
- shadcn/ui: 필요한 컴포넌트만 가져와서 Nook 스타일로 수정한다
- Supabase: DB, 로그인 (지역: eu-west-1 아일랜드)
- Markdown: react-markdown + remark-gfm + remark-breaks (HTML 무시 `skipHtml`, 위험 링크 차단 기본값, 이미지는 링크로, 글 보기는 서버에서 렌더링)
- PWA: 홈 화면 설치 + 작성 중 오프라인 보관(자동 저장)
- 사진: Supabase Storage 비공개 버킷 `post-images`(`<user>/<post>/<id>.webp`), 기기에서 긴 변 2000px WebP로 줄이며 위치 정보(EXIF) 제거(`src/lib/resize-image.ts`), 볼 때는 1시간 서명 주소, Vercel 이미지 최적화 안 씀
- 배포: Vercel (Hobby) — https://nook-three-opal.vercel.app
  - `main`에 병합하면 자동 배포, PR마다 미리보기 주소가 생긴다
  - 서버 실행 지역은 Supabase와 같은 곳(`vercel.json`의 `regions: ["dub1"]`). Supabase 지역을 옮기면 여기도 같이 바꾼다
  - 환경 변수는 Vercel 대시보드에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 두 개만 (비밀 키 없음)

## 코드 위치
- 화면: `src/app/` (App Router). 로그인 전 `/`는 proxy가 `/welcome`(랜딩)을 보여 준다
- 로그인·승인 안내: `src/proxy.ts` → `src/lib/supabase/proxy.ts` (잠금은 DB가 한다). 승인 여부는 토큰의 `account_status`(DB 훅 `custom_access_token_hook`)로 보고, 승인 전일 때만 DB를 묻는다. 관리자 계정은 대시보드 전용(토큰의 `is_admin` → `/admin`과 그 아래만). 관리 화면 틀은 `src/app/admin/layout.tsx` + `src/components/admin-nav.tsx`
- 공용 로직 `src/lib/`, 화면 조각 `src/components/`
- DB: `supabase/migrations/` (MCP로 적용한 뒤 파일 이름을 실제 적용 번호로 바꾼다)
- Edge Function: `supabase/functions/send-notifications`(알림), `supabase/functions/cleanup-orphan-images`(사진 정리). 배포는 Supabase CLI(`npx supabase@latest functions deploy … --yes`)

## 데이터와 보안 세부
- 모든 테이블은 **RLS(Row Level Security)를 켠다.** 본인만 읽고 쓸 수 있는 정책을 둔다.
- 글·메모는 **승인된 계정만** 읽고 쓴다 (`public.is_approved()`를 쓰는 restrictive 정책). 화면 안내(proxy → `/waiting`)는 보조일 뿐, 잠금은 DB가 한다.
- **앱의 관리 기능으로는 다른 사람의 글과 사진을 볼 수 없다.** 관리자 기능은 계정 정보(아이디·이메일·가입 방식·상태)와 계정별 글·사진 개수만 다루는 security definer 함수(`admin_list_signups`, `admin_set_status`, `admin_delete_account`)로만 한다. 관리자는 자기 자신과 다른 관리자를 지울 수 없다. 글은 암호화 저장이 아니므로 DB 권한이 있는 운영자는 기술적으로 읽을 수 있다. 안내 문구에 "아무도 못 본다"고 쓰지 않는다.
- **사진**은 글당 10장, 계정당 200장, 파일 2MB(`add_post_image`가 확인). Storage 정책은 본인 폴더만이고 관리자 정책은 없다. Storage 파일은 SQL로 지울 수 없으므로(Supabase가 막음) 글 삭제·사진 빼기·탈퇴 때 Storage API로 바로 지우고, 남은 파일(관리자 계정 삭제 등)은 매일 KST 4:30 Edge Function `cleanup-orphan-images`가 지운다.
- **문의하기**(랜딩 → `/contact/sent`)는 `inquiries` 표에 저장한다. 표는 직접 읽거나 쓸 수 없고 `submit_inquiry`(도배 제한)로만 넣고, 관리자는 `admin_list_inquiries`·`admin_update_inquiry`로만 본다. 답장은 운영자가 이메일로 직접, 답장 뒤 1년이 지나면 pg_cron이 자동 삭제. 안내한 답변 시간은 24시간.
- 아이디 계정은 안에서 `<아이디>@users.nook.invalid`로 저장한다(`src/lib/username.ts`, DB 함수 `reset_password_with_code`와 도메인을 맞춘다). 화면에는 아이디만 보여 주고, 메일은 보내지 않는다(Supabase Confirm email 끔).
- 비밀번호 복구는 복구 코드(`account_recovery`, 해시만 저장, 표는 함수로만 접근)로 한다. `reset_password_with_code`는 `auth.users`·`auth.sessions`를 직접 고치므로 공식 API가 아니다. Supabase 업데이트 뒤에도 동작하는지 확인한다.
- 복구 코드 화면을 떠날 때와 로그아웃할 때는 페이지를 전체 새로 불러온다. Next가 지나온 화면을 메모리에 숨겨 두어서, 다음 사람에게 남지 않게 비우는 것이다.
- 관리자 지정처럼 이메일이 들어가는 SQL은 마이그레이션 파일에 넣지 않는다 (저장소가 공개 상태). 대시보드나 일회성 SQL로 한다.
- 기기에 남는 데이터(localStorage 임시본)는 계정별 키(`nook-draft:<user id>:<글 id>`)로 나누고, 로그아웃할 때 지운다.
- 비밀 키, 토큰을 코드나 `.mcp.json`에 넣지 않는다. `.env.local`을 쓰고 git에 올리지 않는다.
  - **예외: 지난 오늘 알림.** 발송용 VAPID 개인 키는 Supabase Edge Function 비밀 값(`VAPID_KEYS`)에만 둔다(코드·Vercel·저장소 X). 공개 키는 `src/lib/push.ts`. 예약 작업이 발송 함수를 부르는 비밀 값은 DB Vault(`push_cron_secret`)에서 만들어 밖으로 꺼내지 않는다.
  - 알림 구독(`push_subscriptions`)은 기기 주소만 담고, 로그아웃·끄기·탈퇴 때 지운다. 알림에는 글 개수만 넣고 글 내용은 넣지 않는다. 서비스워커(`public/sw.js`)는 알림만 처리하고 화면을 캐시하지 않는다.
