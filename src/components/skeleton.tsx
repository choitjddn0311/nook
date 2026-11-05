// 불러오는 동안 보이는 자리 표시(스켈레톤).
// 막대 위로 옅은 빛 띠가 천천히 지나가서 "불러오는 중"임을 알려 준다. 모양·움직임은 globals.css의 .skeleton 참고.

// 막대 하나. 크기·간격만 className으로 넘긴다. 예: <SkeletonBar className="h-4 w-2/3" />
export function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

// 스켈레톤 묶음.
// - 화면 낭독기에는 label("글 목록을 불러오는 중")만 읽히고, 막대들은 숨긴다.
// - 0.15초 뒤에 나타나서, 금방 끝나는 로딩에서 번쩍이지 않게 한다.
export function SkeletonGroup({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" className={`skeleton-group ${className}`}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="contents">
        {children}
      </div>
    </div>
  );
}
