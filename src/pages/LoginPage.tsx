import { AppMark } from "@/components/layout/AppMark";
import { useApp } from "@/components/layout/AppProvider";
import { adminFetch } from "@/lib/api-client";
import { hasAdminKey, setAdminKey } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function LoginPage() {
  return (
    <ToastProvider>
      <LoginForm />
    </ToastProvider>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { app } = useApp();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasAdminKey()) {
      navigate("/experts", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError("Admin API key is required");
      return;
    }

    setLoading(true);
    try {
      // Cheap auth probe: list experts with the candidate key.
      await adminFetch("/admin/experts", {
        method: "GET",
        adminKey: trimmed,
      });
      setAdminKey(trimmed);
      showToast(`Signed in to ${app.name}`, "success");
      navigate("/experts");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid admin API key";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 w-fit">
            <AppMark icon={app.icon} color={app.primary} size="lg" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            {app.name} Admin
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Enter the admin API key for this portal
          </p>
          {app.models.length > 0 ? (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {app.models.map((model) => (
                <span
                  key={model}
                  className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {model}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"
        >
          <Input
            label="Admin API key"
            type="password"
            autoComplete="off"
            placeholder="Enter x-admin-key value"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            error={error}
            hint="Stored in this browser session only"
          />

          <Button
            type="submit"
            className="mt-6 w-full"
            size="lg"
            loading={loading}
          >
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
