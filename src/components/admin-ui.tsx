import { SkeletonBar, SkeletonGroup } from "@/components/skeleton";

// 관리 화면들이 같이 쓰는 모양.
// 폰은 위 줄(AdminNav)이 화면 이름을 보여 주므로 제목은 읽기용으로만, PC는 크게 보인다.
export function AdminTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="sr-only lg:not-sr-only lg:text-2xl lg:leading-tight lg:font-semibold lg:tracking-[-0.02em] lg:text-text">{children}</h1>;
}

export const adminH2 = "text-[17px] leading-snug font-semibold tracking-[-0.01em] text-text";

// PC에서만 테두리 상자. 폰은 상자 없이 줄 목록
export const adminPanel = "lg:rounded-xl lg:border lg:border-border lg:px-5 lg:py-4";

export function AdminSkeleton() {
  return (
    <SkeletonGroup label="관리 정보를 불러오는 중" className="mt-2 flex flex-col gap-3 lg:mt-6">
      <SkeletonBar className="h-16 w-full lg:h-24" />
      <SkeletonBar className="mt-4 h-6 w-32" />
      <SkeletonBar className="h-12 w-full" />
      <SkeletonBar className="h-12 w-full" />
    </SkeletonGroup>
  );
}
