import { NextResponse } from "next/server";
import {
  getCronRecipient,
  isReportCronConfigured,
  isReportEmailConfigured,
} from "@/lib/send-report-email";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    emailConfigured: isReportEmailConfigured(),
    cronConfigured: isReportCronConfigured(),
    recipient: getCronRecipient() || null,
  });
}
