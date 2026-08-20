import type { ExpertPeriodRow, UserPeriodRow } from "@/lib/period-report";
import { Card, EmptyState } from "@/components/ui/Card";
import { CopyId } from "@/components/ui/CopyId";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

function formatWhen(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function ReportUserTable({ users }: { users: UserPeriodRow[] }) {
  return (
    <Card
      title="Users who requested"
      description="People who opened an evaluation request in this period."
    >
      {users.length === 0 ? (
        <EmptyState
          title="No user requests in this period"
          description="No evaluation requests were created in the selected range."
        />
      ) : (
        <div className="-mx-4 overflow-x-auto sm:-mx-6">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3 font-semibold sm:px-6">User</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell sm:px-6">
                  Email
                </th>
                <th className="px-4 py-3 text-right font-semibold sm:px-6">
                  Requested
                </th>
                <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell sm:px-6">
                  Completed
                </th>
                <th className="hidden px-4 py-3 text-right font-semibold lg:table-cell sm:px-6">
                  Missed
                </th>
                <th className="hidden px-4 py-3 font-semibold xl:table-cell sm:px-6">
                  Last request
                </th>
                <th className="px-4 py-3 text-right font-semibold sm:px-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((row) => (
                <tr key={row.userId} className="hover:bg-input-bg/50">
                  <td className="px-4 py-3 sm:px-6">
                    <div className="font-medium">{row.name}</div>
                    <div className="mt-1 md:hidden">
                      <CopyId value={row.userId} label="User Mongo ID" />
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-text-muted md:table-cell sm:px-6">
                    {row.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary sm:px-6">
                    {row.requestsCreated}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell sm:px-6">
                    {row.requestsCompleted}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums lg:table-cell sm:px-6">
                    {row.missedDeadlines}
                  </td>
                  <td className="hidden px-4 py-3 text-text-muted xl:table-cell sm:px-6">
                    {formatWhen(row.lastRequestAt)}
                  </td>
                  <td className="px-4 py-3 text-right sm:px-6">
                    <Link to={`/users/${row.userId}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function ReportExpertTable({ experts }: { experts: ExpertPeriodRow[] }) {
  return (
    <Card
      title="Experts who completed work"
      description="Experts who finished an assigned request in this period."
    >
      {experts.length === 0 ? (
        <EmptyState
          title="No expert completions in this period"
          description="No assigned requests were completed in the selected range."
        />
      ) : (
        <div className="-mx-4 overflow-x-auto sm:-mx-6">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3 font-semibold sm:px-6">Expert</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell sm:px-6">
                  Email
                </th>
                <th className="px-4 py-3 text-right font-semibold sm:px-6">
                  Completed
                </th>
                <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell sm:px-6">
                  Missed
                </th>
                <th className="hidden px-4 py-3 text-right font-semibold lg:table-cell sm:px-6">
                  Avg hours
                </th>
                <th className="px-4 py-3 text-right font-semibold sm:px-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {experts.map((row) => (
                <tr key={row.expertId} className="hover:bg-input-bg/50">
                  <td className="px-4 py-3 sm:px-6">
                    <div className="font-medium">{row.name}</div>
                    <p className="text-xs text-text-muted md:hidden">
                      {row.email || "—"}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-text-muted md:table-cell sm:px-6">
                    {row.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-success-text sm:px-6">
                    {row.completed}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell sm:px-6">
                    {row.missedDeadlines}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums lg:table-cell sm:px-6">
                    {row.avgCompletionHours == null
                      ? "—"
                      : `${row.avgCompletionHours}h`}
                  </td>
                  <td className="px-4 py-3 text-right sm:px-6">
                    <Link to={`/experts/${row.expertId}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
