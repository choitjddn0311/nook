"use client";

import { useActionState } from "react";
import { submitInquiry, type InquiryState } from "@/app/contact/actions";
import { primaryButton } from "@/lib/button-styles";
import { fieldClass, labelClass } from "@/lib/form-styles";

const initialState: InquiryState = { error: null, email: "", message: "" };

// 랜딩의 문의하기 폼. 보내면 /contact/sent(감사 페이지)로 간다.
export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitInquiry, initialState);
  const describedBy = state.error ? "contact-error" : undefined;

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-email" className={labelClass}>
          답장받을 이메일
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          defaultValue={state.email}
          aria-describedby={describedBy}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contact-message" className={labelClass}>
          문의 내용
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={5}
          maxLength={2000}
          rows={6}
          defaultValue={state.message}
          aria-describedby={["contact-message-hint", describedBy].filter(Boolean).join(" ")}
          className={`${fieldClass} h-auto min-h-36 resize-y py-3 leading-relaxed`}
        />
        <p id="contact-message-hint" className="text-sm text-text-muted">
          2000자까지
        </p>
      </div>

      {/* 자동 프로그램 걸러내기: 사람에게는 보이지 않고, 화면 낭독기와 키보드도 건너뛴다 */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">웹사이트</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-relaxed text-text">
        <input type="checkbox" name="agree" required className="mt-1 size-5 shrink-0 accent-(--accent)" />
        <span>
          답장을 위해 이메일과 문의 내용을 수집하고, 답장한 날부터 1년 동안 보관한 뒤 지우는 데 동의해요. (필수){" "}
          <a href="/privacy#items" target="_blank" rel="noopener" className="text-text-muted underline underline-offset-4">
            처리방침
          </a>
        </span>
      </label>

      <p id="contact-error" role="alert" className="min-h-6 text-sm font-medium text-text empty:min-h-0">
        {state.error}
      </p>

      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "보내는 중…" : "문의 보내기"}
        </button>
      </div>
    </form>
  );
}
