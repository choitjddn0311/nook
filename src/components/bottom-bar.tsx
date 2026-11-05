// 화면 아래에 붙는 버튼 바 (폰에서 엄지가 닿는 자리). 홈·글 보기·글쓰기가 같이 쓴다.
// 위쪽 가장자리에 배경색이 서서히 투명해지는 띠를 둬서, 스크롤된 글이 바 밑으로 '칼로 자른 듯' 끊기지 않고 스며들게 한다.
export function BottomBar({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`sticky bottom-0 -mx-4 bg-bg px-4 pt-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-linear-to-t before:from-bg before:to-transparent sm:-mx-6 sm:px-6 ${className}`}
    >
      {children}
    </div>
  );
}
