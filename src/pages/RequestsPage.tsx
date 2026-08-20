import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";

export default function RequestsPage() {
  return (
    <>
      <PageHeader
        title="Requests"
        description="Global request management — coming in a future release."
      />

      <Card>
        <div className="flex flex-col items-center py-12 text-center">
          <Badge variant="warning" className="mb-4">
            Coming soon
          </Badge>
          <h2 className="text-lg font-semibold text-text">
            Request management not yet available
          </h2>
          <p className="mt-2 max-w-lg text-sm text-text-muted">
            The following admin endpoints return 501 Not Implemented and will
            be wired up in a later phase:
          </p>
          <ul className="mt-4 space-y-2 text-left text-sm text-text-muted">
            <li>
              <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-xs">
                GET /admin/requests
              </code>{" "}
              — List all requests
            </li>
            <li>
              <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-xs">
                GET /admin/requests/:id
              </code>{" "}
              — Request detail
            </li>
            <li>
              <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-xs">
                POST /admin/requests/:id/assign
              </code>{" "}
              — Manual assign
            </li>
            <li>
              <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-xs">
                POST /admin/requests/:id/mark-payment-released
              </code>{" "}
              — Mark payment released
            </li>
          </ul>
          <p className="mt-6 text-sm text-text-muted">
            Until the request list ships, copy request Mongo IDs from{" "}
            <a href="/allocation" className="font-medium text-primary hover:underline">
              Allocation
            </a>{" "}
            (Request Mongo ID column) for offline refunds.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button disabled title="501 Not Implemented">
              Assign expert
            </Button>
            <Button
              variant="secondary"
              disabled
              title="501 Not Implemented"
            >
              Mark payment released
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
