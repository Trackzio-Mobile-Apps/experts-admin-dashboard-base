"use client";

import { AppMark } from "@/components/layout/AppSwitcher";
import { useApp } from "@/components/layout/AppProvider";
import { adminFetch } from "@/lib/api-client";
import { hasAdminKey, setAdminKey } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  return (
    <ToastProvider>
      <LoginForm />
    </ToastProvider>
  );
}

function LoginForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const { apps, app, setActiveAppId } = useApp();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasAdminKey(app.id)) {
      router.replace("/experts");
    }
  }, [app.id, router]);

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
      await adminFetch("/admin/experts", {
        method: "GET",
        adminKey: trimmed,
        baseUrl: app.apiBaseUrl,
      });
      setAdminKey(trimmed, app.id);
      showToast(`Signed in to ${app.name}`, "success");
      router.push("/experts");
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
            Enter the admin API key for this app
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

        {apps.length > 1 ? (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {apps.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveAppId(item.id);
                  setError("");
                  setApiKey("");
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  item.id === app.id
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text"
                }`}
              >
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold text-white"
                  style={{ backgroundColor: item.primary }}
                >
                  {item.icon}
                </span>
                {item.name}
              </button>
            ))}
          </div>
        ) : null}

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
            hint={`Stored for ${app.name} in this browser session only`}
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

        <p className="mt-6 text-center text-xs text-text-muted">
          Each app uses its own API base and key. Add more apps in Settings.
        </p>
      </div>
    </div>
  );
}
