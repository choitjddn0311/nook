// 사이트 주소와 소개 문구. 링크 미리보기(Open Graph)·검색 엔진(robots, sitemap)이 함께 쓴다.
// 도메인을 사면 SITE_URL만 바꾸고, 검색 엔진에 새 주소로 다시 등록한다.
export const SITE_URL = "https://nook-three-opal.vercel.app";

export const SITE_TITLE = "오늘의 생각을 다시 만나는 곳, Nook.";
// 검색 결과에 보이는 설명. 한국어 검색 결과는 80자 안팎까지 보여 주므로 그 안에서 무엇을 하는 곳인지 말한다.
export const SITE_DESCRIPTION =
  "몇 줄로 정리해 둔 생각을 한 달 뒤, 6개월 뒤, 1년 뒤 같은 날에 다시 만나는 개인 기록장이에요. 나만 볼 수 있고, 광고와 피드가 없어요.";

// 검색 엔진 소유 확인 코드 (Google Search Console, 네이버 서치어드바이저의 'HTML 태그' 방식).
// 받은 meta 태그의 content 값만 넣는다. 비어 있으면 태그를 넣지 않는다. 공개돼도 괜찮은 값이다.
export const SEARCH_VERIFICATION = {
  google: "",
  naver: "",
};

// 검색에 나와도 되는 공개 화면. 나머지(글, 마이페이지, 관리 등)는 로그인 뒤라 검색에서 뺀다.
export const PUBLIC_PAGES = ["/", "/privacy", "/terms"] as const;
