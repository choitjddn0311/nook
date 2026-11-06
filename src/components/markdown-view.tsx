import Markdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

// Markdown 글을 서식으로 보여 준다. 글 보기(서버)와 글쓰기 미리보기(브라우저)가 같이 쓴다.
//
// 보안
// - react-markdown은 dangerouslySetInnerHTML을 쓰지 않고 React 요소로 만든다
// - skipHtml: 본문에 섞인 <script>, <img onerror> 같은 HTML은 아예 버린다
// - 링크 주소는 기본 urlTransform이 javascript: 같은 위험한 주소를 지운다
// - 이미지는 그리지 않고 링크로 바꾼다 (외부 이미지가 열람 기록을 새게 할 수 있음)
//
// 글쓰기 감각
// - remark-breaks: 엔터 한 번이면 줄이 바뀐다 (Markdown 기본은 엔터 두 번)
// - remark-gfm: 취소선, 체크 목록, 표, 주소 자동 링크

const remarkPlugins = [remarkGfm, remarkBreaks];

const components: Components = {
  // 화면의 제목(h1)은 글 제목이므로 본문 제목은 한 단계씩 낮춘다 (# → h2)
  h1: "h2",
  h2: "h3",
  h3: "h4",
  h4: "h5",
  h5: "h6",
  a(props) {
    // node(문서 구조 정보)는 a 태그 속성이 아니므로 빼고 넘긴다
    const { node, ...rest } = props;
    void node;
    // 위험한 주소(javascript: 등)는 기본 urlTransform이 비워 둔다 → 링크 대신 글자만
    if (!rest.href) return <span>{rest.children}</span>;
    return <a {...rest} target="_blank" rel="noopener noreferrer" />;
  },
  img({ src, alt }) {
    if (typeof src !== "string" || !src) return <span>{alt}</span>;
    return (
      <a href={src} target="_blank" rel="noopener noreferrer">
        {alt || "이미지 링크"}
      </a>
    );
  },
};

export function MarkdownView({ content }: { content: string }) {
  return (
    <div className="markdown">
      <Markdown remarkPlugins={remarkPlugins} components={components} skipHtml>
        {content}
      </Markdown>
    </div>
  );
}
