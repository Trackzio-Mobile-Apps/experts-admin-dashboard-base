import { statusBadgeVariant } from "@/components/ui/Badge";

/** Status chip color for evaluation request rows. */
export function requestStatusVariant(
  status: string,
): ReturnType<typeof statusBadgeVariant> {
  switch (status) {
    case "completed":
      return "success";
    case "deadline_missed":
    case "expired":
    case "cancelled":
      return "danger";
    case "refund_pending":
    case "refund_processing":
    case "refunded":
      return "warning";
    case "accepted":
    case "report_submitted":
    case "offered":
      return "info";
    default:
      return statusBadgeVariant(status);
  }
}

export const REQUEST_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "created", label: "Created" },
  { value: "allocating", label: "Allocating" },
  { value: "offered", label: "Offered" },
  { value: "accepted", label: "Accepted" },
  { value: "report_submitted", label: "Report submitted" },
  { value: "completed", label: "Completed" },
  { value: "deadline_missed", label: "Deadline missed" },
  { value: "retry_pending", label: "Retry pending" },
  { value: "refund_pending", label: "Refund pending" },
  { value: "refund_processing", label: "Refund processing" },
  { value: "refunded", label: "Refunded" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];
