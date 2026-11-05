// 본문 글자 수·단어 수.
// 글자 수는 공백 포함, 이모지·한글 조합 문자도 눈에 보이는 한 글자를 1로 센다(Intl.Segmenter).

const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("ko", { granularity: "grapheme" }) : null;

export function countText(text: string) {
  const chars = segmenter ? Array.from(segmenter.segment(text)).length : [...text].length;
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  return { chars, words };
}

export function formatTextStats(text: string) {
  const { chars, words } = countText(text);
  return `${chars.toLocaleString("ko-KR")}자 ${words.toLocaleString("ko-KR")}단어`;
}
