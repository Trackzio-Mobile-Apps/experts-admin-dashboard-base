import { useAdminKey } from "@/components/layout/AdminAuthGuard";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { createUserRequest } from "@/lib/admin-api";
import { useApiHandler } from "@/lib/useApiHandler";
import { useState } from "react";

type CreateRequestModalProps = {
  open: boolean;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateRequestModal({
  open,
  userId,
  onClose,
  onSuccess,
}: CreateRequestModalProps) {
  const adminKey = useAdminKey();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();
  const [country, setCountry] = useState("IN");
  const [obverse, setObverse] = useState("");
  const [reverse, setReverse] = useState("");
  const [edge, setEdge] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!country.trim()) {
      setError("Country is required");
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

  const confirmCreate = async () => {
    setLoading(true);
    try {
      const media: Record<string, string[] | null> = {};
      if (obverse.trim()) media.obverse = [obverse.trim()];
      if (reverse.trim()) media.reverse = [reverse.trim()];
      if (edge.trim()) media.edge = [edge.trim()];
      media.video = null;

      await createUserRequest(adminKey, userId, {
        country: country.trim().toUpperCase(),
        payload: Object.keys(media).length ? { media } : {},
      });

      showToast("Request created (1 credit consumed)", "success");
      setConfirmOpen(false);
      onSuccess();
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
        <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl">
          <h2 className="text-lg font-semibold">Create request</h2>
          <p className="mt-1 text-sm text-text-muted">
            Creates a request on behalf of the user. Consumes 1 credit.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              error={error}
              placeholder="IN"
              hint="ISO country code"
            />
            <Input
              label="Obverse image URL"
              type="url"
              value={obverse}
              onChange={(e) => setObverse(e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Reverse image URL"
              type="url"
              value={reverse}
              onChange={(e) => setReverse(e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Edge image URL"
              type="url"
              value={edge}
              onChange={(e) => setEdge(e.target.value)}
              placeholder="https://..."
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button type="submit">Review request</Button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm request creation"
        description={`Create a request for country ${country.trim().toUpperCase()}? This will consume 1 credit.`}
        confirmLabel="Create request"
        loading={loading}
        onConfirm={confirmCreate}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
