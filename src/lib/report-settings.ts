const STORAGE_KEY = "coinzy_report_recipient_email";

export function getDefaultReportRecipient(): string {
  return process.env.NEXT_PUBLIC_REPORT_RECIPIENT_EMAIL?.trim() ?? "";
}

export function getSavedReportRecipient(): string {
  if (typeof window === "undefined") return getDefaultReportRecipient();
  const saved = window.localStorage.getItem(STORAGE_KEY)?.trim();
  return saved || getDefaultReportRecipient();
}

export function saveReportRecipient(email: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, email.trim());
}
