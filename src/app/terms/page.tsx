import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalSection } from "@/components/legal-document";
import { OPERATOR } from "@/lib/legal";

export const metadata: Metadata = { title: "이용약관 · Nook" };

export default function TermsPage() {
  return (
    <LegalDocument title="이용약관">
      <LegalSection title="1. 서비스">
        <p>
          Nook은 {OPERATOR.name}이 개인으로 운영하는 기록 서비스예요. 생각을 적어 두고 다시 꺼내 볼 수 있어요. 지금은 무료로 제공해요. 유료 기능을 만들게 되면 미리 알려
          드리고, 이용자가 선택하지 않는 한 비용을 받지 않아요.
        </p>
      </LegalSection>

      <LegalSection title="2. 가입과 승인">
        <ul>
          <li>만 14세 이상이면 가입을 신청할 수 있어요.</li>
          <li>지금은 운영자가 승인한 계정만 쓸 수 있어요. 운영 상황에 따라 승인을 거절하거나 미룰 수 있어요.</li>
          <li>계정과 비밀번호, 복구 코드는 직접 안전하게 보관해 주세요. 복구 코드까지 잃어버리면 계정을 되찾지 못할 수 있어요.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. 내 글">
        <p>
          쓴 글의 권리는 쓴 사람에게 있어요. 운영자는 글을 저장하고 본인에게 보여 주는 데 필요한 범위에서만 다뤄요. 서비스에는 글을 공개하는 기능이 없어요. 글을 어떻게 다루는지는{" "}
          <Link href="/privacy" className="text-text underline underline-offset-4">
            개인정보 처리방침
          </Link>
          에 적어 두었어요.
        </p>
      </LegalSection>

      <LegalSection title="4. 하면 안 되는 일">
        <ul>
          <li>다른 사람의 계정이나 정보를 도용하는 일</li>
          <li>법을 어기는 내용을 저장하거나, 법을 어기는 데 서비스를 쓰는 일</li>
          <li>서비스를 해킹하거나, 지나친 요청으로 운영을 방해하는 일</li>
        </ul>
        <p>이런 경우 이용을 제한할 수 있어요. 급하지 않다면 먼저 알려 드릴게요.</p>
      </LegalSection>

      <LegalSection title="5. 서비스 변경과 중단">
        <p>
          기능은 바뀌거나 없어질 수 있어요. 서비스를 끝내게 되면 내 글을 내보낼 수 있도록 최소 30일 전에 서비스 안에서 알려 드려요. 점검이나 장애로 잠시 멈출 수 있어요.
        </p>
      </LegalSection>

      <LegalSection title="6. 데이터와 책임">
        <p>
          데이터를 안전하게 지키려고 노력하지만, 무료로 제공하는 개인 운영 서비스라서 장애나 데이터 손실이 전혀 없다고 보장하지는 못해요. <strong>중요한 글은 마이페이지의 내 글 내보내기로 가끔 받아 두세요.</strong>
        </p>
        <p>운영자의 고의나 중대한 과실로 생긴 손해는 법령에 따라 책임져요. 그 밖에 무료 서비스 이용으로 생긴 손해에 대해서는 법령이 허용하는 범위에서 책임을 지지 않아요.</p>
      </LegalSection>

      <LegalSection title="7. 탈퇴">
        <p>언제든 탈퇴할 수 있어요. 탈퇴하면 계정과 글이 바로 지워지고 되살릴 수 없어요.</p>
      </LegalSection>

      <LegalSection title="8. 약관 변경과 적용 법">
        <p>약관을 바꾸면 시행 7일 전에 서비스 안에서 알려 드려요. 이용자에게 불리한 변경은 30일 전에 알려 드려요. 이 약관은 대한민국 법을 따라요.</p>
      </LegalSection>

      <LegalSection title="9. 문의">
        <ul>
          <li>운영자: {OPERATOR.name}</li>
          <li>이메일: {OPERATOR.email}</li>
          <li>전화: {OPERATOR.phone}</li>
        </ul>
      </LegalSection>
    </LegalDocument>
  );
}
