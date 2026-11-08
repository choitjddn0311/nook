import "server-only";

// Supabase(PostgREST)는 한 번에 최대 1000행만 돌려준다. 글이 많아도 전부 받도록 나눠서 읽는다.
// 페이지가 바뀌어도 순서가 흔들리지 않게, 넘겨주는 쿼리는 겹치지 않는 정렬(예: created_at + id)을 가져야 한다.
export const PAGE_ROWS = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

export async function fetchAll<T>(page: (from: number, to: number) => Page<T>): Promise<T[] | null> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_ROWS) {
    const { data, error } = await page(from, from + PAGE_ROWS - 1);
    if (error || !data) return null;
    rows.push(...data);
    if (data.length < PAGE_ROWS) return rows;
  }
}
