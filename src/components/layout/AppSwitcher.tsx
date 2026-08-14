"use client";

import { useApp } from "@/components/layout/AppProvider";
import { hasAdminKey } from "@/lib/auth";
import { useRouter } from "next/navigation";

export function AppMark({
  icon,
  color,
  size = "md",
}: {
  icon: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "lg"
      ? "h-14 w-14 rounded-2xl text-2xl"
      : size === "sm"
        ? "h-8 w-8 rounded-lg text-xs"
        : "h-11 w-11 rounded-xl text-lg";
  return (
    <div
      className={`flex shrink-0 items-center justify-center font-bold text-white shadow-sm ${box}`}
      style={{ backgroundColor: color }}
    >
      {icon}
    </div>
  );
}

export function AppSwitcher({ compact = false }: { compact?: boolean }) {
  const { apps, app, setActiveAppId } = useApp();
  const router = useRouter();

  if (apps.length < 2) return null;

  const switchTo = (id: string) => {
    setActiveAppId(id);
    if (!hasAdminKey(id)) {
      router.push("/login");
    }
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-expert-sidebar-muted">
        Apps
      </p>
      <div className="flex flex-wrap gap-1.5">
        {apps.map((item) => {
          const active = item.id === app.id;
          return (
            <button
              key={item.id}
              type="button"
              title={item.name}
              onClick={() => switchTo(item.id)}
              className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-bold text-white transition ${
                active
                  ? "ring-2 ring-white ring-offset-2 ring-offset-transparent"
                  : "opacity-70 hover:opacity-100"
              }`}
              style={{ backgroundColor: item.primary }}
            >
              {item.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}
