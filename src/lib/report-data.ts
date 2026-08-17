import { getUser, listExperts, listUsers } from "@/lib/admin-api";
import { userStats } from "@/lib/user-metrics";
import type { ReportSourceData } from "@/lib/period-report";
import type { AdminUserRequest, User } from "@/types/admin-api";

const FETCH_CONCURRENCY = 6;

/** Run async work over `items` with a fixed worker pool. Preserves input order. */
async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

/**
 * Loads users, experts, and per-user request history for period reports.
 * User detail fetches run in a small pool so we do not stampede the API.
 */
export async function loadReportSourceData(
  adminKey: string,
  onProgress?: (done: number, total: number) => void,
): Promise<ReportSourceData> {
  const [users, experts] = await Promise.all([
    listUsers(adminKey),
    listExperts(adminKey),
  ]);

  const withRequests = users.filter(
    (user) => userStats(user).totalRequests > 0,
  );
  const requestsByUserId: Record<string, AdminUserRequest[]> = {};
  const total = withRequests.length;
  let done = 0;
  onProgress?.(0, total);

  if (total === 0) {
    return { users, experts, requestsByUserId };
  }

  await mapPool(withRequests, FETCH_CONCURRENCY, async (user: User) => {
    try {
      const detail = await getUser(adminKey, user._id);
      requestsByUserId[user._id] = detail.requests;
    } catch {
      requestsByUserId[user._id] = [];
    } finally {
      done += 1;
      onProgress?.(done, total);
    }
    return user._id;
  });

  return { users, experts, requestsByUserId };
}
