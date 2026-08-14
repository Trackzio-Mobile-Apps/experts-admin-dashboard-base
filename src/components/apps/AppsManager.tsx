"use client";

import { useApp } from "@/components/layout/AppProvider";
import { AppMark } from "@/components/layout/AppSwitcher";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { APP_COLOR_PRESETS } from "@/lib/apps";
import { hasAdminKey } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AppsManager({
  onToast,
}: {
  onToast: (message: string, tone: "success" | "error") => void;
}) {
  const { apps, app, setActiveAppId, addApp, removeApp } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [primary, setPrimary] = useState<string>(APP_COLOR_PRESETS[1]);
  const [models, setModels] = useState("");

  const handleAdd = () => {
    const created = addApp({
      name,
      apiBaseUrl,
      icon,
      primary,
      models,
    });
    if (!created) {
      onToast("Name and API base URL are required", "error");
      return;
    }
    setName("");
    setApiBaseUrl("");
    setIcon("");
    setModels("");
    onToast(`${created.name} added. Sign in with that app’s admin key.`, "success");
  };

  return (
    <Card
      title="Apps"
      description="Switch apps from the sidebar. Icon, color, models, and results follow the selected app. Compare stays shared."
    >
      <ul className="space-y-3">
        {apps.map((item) => (
          <li
            key={item.id}
            className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
              item.id === app.id ? "border-primary bg-primary-soft/40" : "border-border"
            }`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <AppMark icon={item.icon} color={item.primary} size="sm" />
              <div className="min-w-0">
                <p className="font-medium text-text">
                  {item.name}
                  {item.id === app.id ? (
                    <span className="ml-2 text-xs font-semibold text-primary">
                      Active
                    </span>
                  ) : null}
                </p>
                <p className="truncate font-mono text-[11px] text-text-muted">
                  {item.apiBaseUrl}
                </p>
                {item.models.length > 0 ? (
                  <p className="mt-1 text-xs text-text-muted">
                    {item.models.join(" · ")}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {item.id !== app.id ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setActiveAppId(item.id);
                    if (!hasAdminKey(item.id)) router.push("/login");
                  }}
                >
                  Switch
                </Button>
              ) : null}
              {item.source === "local" ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    removeApp(item.id);
                    onToast(`${item.name} removed`, "success");
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-border pt-6">
        <h3 className="mb-4 text-sm font-semibold text-text">Add another app</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Banknote"
          />
          <Input
            label="Icon letter"
            value={icon}
            maxLength={2}
            onChange={(e) => setIcon(e.target.value.toUpperCase())}
            placeholder="B"
            hint="1–2 characters"
          />
          <div className="sm:col-span-2">
            <Input
              label="API base URL"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://banknote-experts-api.example.com"
            />
          </div>
          <Input
            label="Models"
            value={models}
            onChange={(e) => setModels(e.target.value)}
            placeholder="Banknote evaluation, Grading"
            hint="Comma-separated labels shown when this app is active"
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">Color</span>
            <div className="flex flex-wrap gap-2">
              {APP_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  onClick={() => setPrimary(color)}
                  className={`h-8 w-8 rounded-full ${
                    primary === color ? "ring-2 ring-offset-2 ring-text" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
        <Button className="mt-4" onClick={handleAdd}>
          Add app
        </Button>
      </div>
    </Card>
  );
}
