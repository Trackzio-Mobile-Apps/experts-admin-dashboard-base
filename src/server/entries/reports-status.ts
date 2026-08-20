import { handleReportsStatus } from "../reports-api";

export default async function handler(): Promise<Response> {
  return handleReportsStatus();
}
