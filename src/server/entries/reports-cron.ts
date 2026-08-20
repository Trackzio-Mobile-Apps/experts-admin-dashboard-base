import { handleReportsCron } from "../reports-api";

export default async function handler(request: Request): Promise<Response> {
  return handleReportsCron(request);
}
