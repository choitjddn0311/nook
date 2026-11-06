// 홈 목록 거르기 상태. 주소창에 담아 둔다 → 새로고침·뒤로 가기·공유해도 그대로.
// 예: /?q=비&tag=일기&fav=1  (정렬은 없음: 항상 최신순)
import { normalizeTag } from "@/lib/tags";

export type HomeFilters = {
  q: string | null; // 검색어 (제목·본문)
  tag: string | null;
  fav: boolean; // 즐겨찾기만
};

export const SEARCH_MAX = 100;

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export function parseHomeFilters(params: Params): HomeFilters {
  const q = one(params.q).trim().slice(0, SEARCH_MAX);
  return {
    q: q || null,
    tag: normalizeTag(one(params.tag)),
    fav: one(params.fav) === "1",
  };
}

// 지금 거르기에서 일부만 바꾼 주소 만들기 (나머지는 유지)
export function homeHref(current: HomeFilters, change: Partial<HomeFilters> = {}) {
  const f = { ...current, ...change };
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.tag) sp.set("tag", f.tag);
  if (f.fav) sp.set("fav", "1");
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

export const hasAnyFilter = (f: HomeFilters) => Boolean(f.q || f.tag || f.fav);

// 검색어를 PostgREST or() 조건에 안전하게 넣기
// 1) LIKE 특수문자(\ % _)는 글자 그대로 찾도록 \ 로 이스케이프
// 2) or() 값은 큰따옴표로 감싸고, 그 안의 \ 와 " 를 다시 이스케이프 (쉼표·괄호가 있어도 안전)
export function searchCondition(q: string) {
  const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const quoted = `"${like.replace(/[\\"]/g, (m) => `\\${m}`)}"`;
  return `title.ilike.${quoted},content.ilike.${quoted}`;
}
