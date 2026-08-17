import { getAdminApp } from "@/lib/apps";

function storageKey(): string {
  return `admin_report_recipient_email:${getAdminApp().id}`;
}

const LEGACY_COINZY_KEY = "coinzy_report_recipient_email";

export function getDefaultReportRecipient(): string {
  return process.env.NEXT_PUBLIC_REPORT_RECIPIENT_EMAIL?.trim() ?? "";
}

export function getSavedReportRecipient(): string {
  if (typeof window === "undefined") return getDefaultReportRecipient();
  const saved = window.localStorage.getItem(storageKey())?.trim();
  if (saved) return saved;
  if (getAdminApp().id === "coinzy") {
    const legacy = window.localStorage.getItem(LEGACY_COINZY_KEY)?.trim();
    if (legacy) return legacy;
  }
  return getDefaultReportRecipient();
}

export function saveReportRecipient(email: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(), email.trim());
}
