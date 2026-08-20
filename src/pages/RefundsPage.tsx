import { OfflineRefundForm } from "@/components/refunds/OfflineRefundForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, LoadingState, PageHeader } from "@/components/ui/Card";
import { Suspense } from "react";

export default function RefundsPage() {
  return (
    <>
      <PageHeader
        title="Refunds"
        description="Handle offline refunds manually until the Refund Queue APIs ship."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Refund queue">
          <div className="flex flex-col items-center py-8 text-center">
            <Badge variant="warning" className="mb-4">
              Phase B — coming soon
            </Badge>
            <p className="max-w-md text-sm text-text-muted">
              Approve / Reject is not implemented yet. Pending refunds will appear
              here once backend ships{" "}
              <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-xs">
                GET /admin/requests?status=refund_pending
              </code>{" "}
              and the approve/reject endpoints. Those routes currently return{" "}
              <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-xs">
                501
              </code>
              .
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button disabled title="501 — not implemented">
                Approve refund
              </Button>
              <Button variant="secondary" disabled title="501 — not implemented">
                Reject refund
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Legacy manual flow (use today)">
          <p className="mb-4 text-sm text-text-muted">
            No automated refund API exists yet. Refund the store payment outside
            this app, then restore credits here via{" "}
            <code className="rounded bg-input-bg px-1 py-0.5 font-mono text-xs">
              POST /admin/users/:userId/credits/adjust
            </code>
            . Body is only{" "}
            <code className="rounded bg-input-bg px-1 py-0.5 font-mono text-xs">
              amount
            </code>{" "}
            +{" "}
            <code className="rounded bg-input-bg px-1 py-0.5 font-mono text-xs">
              reason
            </code>
            . Prefill from Users → user detail → Use in refund.
          </p>
          <Suspense fallback={<LoadingState label="Loading refund form…" />}>
            <OfflineRefundForm />
          </Suspense>
        </Card>
      </div>

      <Card title="Current limitations" className="mt-6">
        <ul className="space-y-2 text-sm text-text-muted">
          <li>✅ Restores the user&apos;s credits via credit adjust</li>
          <li>
            ✅ Leaves an audit trail through{" "}
            <code className="rounded bg-input-bg px-1 py-0.5 font-mono text-xs">
              admin_adjustment
            </code>{" "}
            + reason (request id embedded in reason text only)
          </li>
          <li>
            ❌ Does not create a{" "}
            <code className="rounded bg-input-bg px-1 py-0.5 font-mono text-xs">
              refund
            </code>{" "}
            ledger entry
          </li>
          <li>
            ❌ Does not set{" "}
            <code className="rounded bg-input-bg px-1 py-0.5 font-mono text-xs">
              ledger.requestId
            </code>
          </li>
          <li>
            ❌ Does not automatically change request status to{" "}
            <code className="rounded bg-input-bg px-1 py-0.5 font-mono text-xs">
              refunded
            </code>
          </li>
        </ul>
        <p className="mt-4 text-sm text-text-muted">
          Those last items require the backend refund APIs and the planned Refund
          Queue / Approve / Reject flow.
        </p>
      </Card>

      <Card title="Target flow (Phase A–C)" className="mt-6">
        <div className="space-y-4 text-sm text-text-muted">
          <p>
            <strong className="text-text">1.</strong> User on{" "}
            <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-xs">
              deadline_missed
            </code>{" "}
            taps <em>Request refund</em> →{" "}
            <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-xs">
              refund_pending
            </code>
          </p>
          <p>
            <strong className="text-text">2.</strong> Admin approves → +1 credit,
            ledger type{" "}
            <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-xs">
              refund
            </code>
            , status{" "}
            <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-xs">
              refunded
            </code>
            , RTN{" "}
            <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-xs">
              request.refunded
            </code>
          </p>
          <p>
            <strong className="text-text">3.</strong> Store money refund remains
            manual — credit restore and store refund are separate steps.
          </p>
          <p>
            Spec reference (until{" "}
            <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-xs">
              public/admin/refunds.md
            </code>{" "}
            exists):{" "}
            <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-xs">
              coinzy-experts-backend/public/mobile-user/requests.md
            </code>{" "}
            → Refund Handling.
          </p>
        </div>
      </Card>
    </>
  );
}
