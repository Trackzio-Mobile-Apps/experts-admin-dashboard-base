import { useAdminKey } from "@/components/layout/AdminAuthGuard";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { adjustUserCredits } from "@/lib/admin-api";
import { useApiHandler } from "@/lib/useApiHandler";
import { useState } from "react";

type CreditAdjustModalProps = {
  open: boolean;
  userId: string;
  currentBalance: number;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
};

export function CreditAdjustModal({
  open,
  userId,
  currentBalance,
  onClose,
  onSuccess,
}: CreditAdjustModalProps) {
  const adminKey = useAdminKey();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("manual_grant");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parsedAmount = Number.parseInt(amount, 10);
  const projectedBalance = currentBalance + (Number.isNaN(parsedAmount) ? 0 : parsedAmount);

  const validate = () => {
    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount === 0) {
      setError("Amount must be a non-zero integer");
      return false;
    }
    if (projectedBalance < 0) {
      setError("Balance cannot go negative");
      return false;
    }
    if (!reason.trim()) {
      setError("Reason is required");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const confirmAdjust = async () => {
    setLoading(true);
    try {
      const result = await adjustUserCredits(adminKey, userId, {
        amount: parsedAmount,
        reason: reason.trim(),
      });
      showToast("Credits adjusted", "success");
      setAmount("");
      setConfirmOpen(false);
      onSuccess(result.creditBalance);
    } catch (err) {
      handleApiError(err, (msg) => showToast(msg, "error"));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <button
          type="button"
          className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
          aria-label="Close"
          onClick={onClose}
        />
        <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
          <h2 className="text-lg font-semibold">Adjust credits</h2>
          <p className="mt-1 text-sm text-text-muted">
            Current balance: <strong>{currentBalance}</strong>
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              hint="Positive to add, negative to deduct"
              error={error}
              placeholder="1 or -1"
            />
            <Textarea
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
            {!Number.isNaN(parsedAmount) && amount.trim() ? (
              <p className="text-sm text-text-muted">
                New balance:{" "}
                <span
                  className={
                    projectedBalance < 0
                      ? "font-semibold text-danger"
                      : "font-semibold text-text"
                  }
                >
                  {projectedBalance}
                </span>
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button type="submit">Review adjustment</Button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm credit adjustment"
        description={`Adjust credits by ${parsedAmount} (${reason.trim()}). New balance will be ${projectedBalance}.`}
        confirmLabel="Confirm adjustment"
        loading={loading}
        onConfirm={confirmAdjust}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
