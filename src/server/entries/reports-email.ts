import { handleReportsEmail } from "../reports-api";

export default async function handler(request: Request): Promise<Response> {
  return handleReportsEmail(request);
}
