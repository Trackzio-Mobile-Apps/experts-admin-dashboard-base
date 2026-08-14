"use client";

import { useLogout } from "@/components/layout/AdminAuthGuard";
import { useApp } from "@/components/layout/AppProvider";
import { AppsManager } from "@/components/apps/AppsManager";
import { getApiBaseUrl } from "@/lib/api-client";
import { getAdminKey, setAdminKey } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { isValidEmail } from "@/lib/period";
import {
  getSavedReportRecipient,
  saveReportRecipient,
} from "@/lib/report-settings";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const logout = useLogout();
  const { app } = useApp();
  const { showToast } = useToast();
  const [apiKey, setApiKeyInput] = useState("");
  const [reportEmail, setReportEmail] = useState("");

  useEffect(() => {
    setApiKeyInput(getAdminKey(app.id) ?? "");
    setReportEmail(getSavedReportRecipient());
  }, [app.id]);

  const handleUpdateKey = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      showToast("API key cannot be empty", "error");
      return;
    }
    setAdminKey(trimmed, app.id);
    showToast(`API key updated for ${app.name}`, "success");
  };

  const handleClearKey = () => {
    logout();
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Session, apps, and connection configuration."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="API connection">
          <dl className="mb-4 space-y-3 text-sm">
            <div>
              <dt className="text-text-muted">Base URL</dt>
              <dd className="mt-0.5 font-mono text-xs">{app.apiBaseUrl || getApiBaseUrl()}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Active app</dt>
              <dd className="mt-0.5 text-sm">{app.name}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Auth header</dt>
              <dd className="mt-0.5 font-mono text-xs">x-admin-key</dd>
            </div>
          </dl>
          <p className="text-xs text-text-muted">
            Configure{" "}
            <code className="rounded bg-input-bg px-1 py-0.5">
              NEXT_PUBLIC_API_BASE_URL
            </code>{" "}
            in <code className="rounded bg-input-bg px-1 py-0.5">.env.local</code>
          </p>
        </Card>

        <Card title="Admin API key">
          <p className="mb-4 text-sm text-text-muted">
            Update the key used for {app.name} in this browser session.
            Each app keeps its own key.
          </p>
          <div className="space-y-4">
            <Input
              label="API key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKeyInput(e.target.value)}
              autoComplete="off"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleUpdateKey}>Update key</Button>
              <Button variant="danger" onClick={handleClearKey}>
                Sign out
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <AppsManager onToast={showToast} />
      </div>

      <Card title="Weekly & monthly report email" className="mt-6">
        <p className="mb-4 text-sm text-text-muted">
          Inbox for Send now from Reports. Automatic Monday/monthly emails
          also need the Netlify env vars listed on the Reports page.
        </p>
        <div className="space-y-4">
          <Input
            label="Report email"
            type="email"
            value={reportEmail}
            onChange={(e) => setReportEmail(e.target.value)}
            placeholder="ops@example.com"
          />
          <Button
            onClick={() => {
              const trimmed = reportEmail.trim();
              if (!isValidEmail(trimmed)) {
                showToast("Enter a valid report email address", "error");
                return;
              }
              saveReportRecipient(trimmed);
              showToast("Report email saved on this device", "success");
            }}
          >
            Save report email
          </Button>
        </div>
      </Card>
    </>
  );
}
