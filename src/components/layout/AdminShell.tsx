import { useLogout } from "@/components/layout/AdminAuthGuard";
import { AppMark } from "@/components/layout/AppMark";
import { useApp } from "@/components/layout/AppProvider";
import { Link, useLocation } from "react-router-dom";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";

/** Primary sidebar destinations for the experts admin portal. */
const NAV: {
  href: string;
  label: string;
  icon: string;
  comingSoon?: boolean;
}[] = [
  { href: "/experts", label: "Experts", icon: "experts" },
  { href: "/users", label: "Users", icon: "users" },
  { href: "/reports", label: "Reports", icon: "reports" },
  { href: "/allocation", label: "Allocation", icon: "allocation" },
  { href: "/refunds", label: "Refunds", icon: "refunds" },
  { href: "/requests", label: "Requests", icon: "requests" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function NavIcon({ kind }: { kind: string }) {
  const cls = "h-5 w-5 shrink-0";
  switch (kind) {
    case "experts":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      );
    case "users":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.09 9.09 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      );
    case "allocation":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      );
    case "refunds":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      );
    case "reports":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
        </svg>
      );
    case "requests":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
  }
}

function SidebarLogo() {
  const { app } = useApp();
  return (
    <div className="flex items-center gap-3">
      <AppMark icon={app.icon} color={app.primary} />
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-semibold tracking-tight text-expert-sidebar-foreground">
          {app.name}
        </p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-expert-sidebar-muted">
          Admin portal
        </p>
      </div>
    </div>
  );
}

type NavInnerProps = {
  onNavigate?: () => void;
  onLogout: () => void;
};

function NavInner({ onNavigate, onLogout }: NavInnerProps) {
  const { pathname } = useLocation();
  const { app } = useApp();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 pb-4">
        <SidebarLogo />
        {app.models.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {app.models.map((model) => (
              <span
                key={model}
                className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-expert-sidebar-foreground"
              >
                {model}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <nav
        className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1"
        aria-label="Admin navigation"
      >
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (item.comingSoon) {
            return (
              <span
                key={item.href}
                title="Coming soon"
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-expert-sidebar-muted/50"
              >
                <NavIcon kind={item.icon} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  Soon
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => onNavigate?.()}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/20 text-expert-sidebar-foreground shadow-sm"
                  : "text-expert-sidebar-muted hover:bg-white/10 hover:text-expert-sidebar-foreground"
              }`}
            >
              <NavIcon kind={item.icon} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-full border border-white/15 bg-black/20 px-4 py-2.5 text-sm font-semibold text-expert-sidebar-foreground transition-colors hover:border-white/25 hover:bg-black/30"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function DesktopSidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-expert-sidebar text-expert-sidebar-foreground lg:flex">
      <div className="flex h-full flex-col overflow-hidden px-4 py-6">
        <NavInner onLogout={onLogout} />
      </div>
    </aside>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const menuId = useId();
  const logout = useLogout();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close mobile nav on route change
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-expert-dashboard-canvas lg:flex-row">
      <DesktopSidebar onLogout={logout} />

      {/* Mobile header — fixed at top of scroll column */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-expert-sidebar px-4 text-expert-sidebar-foreground shadow-sm lg:hidden">
        <SidebarLogo />
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 transition-colors hover:bg-white/10"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label="Open navigation menu"
          onClick={() => setMenuOpen(true)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] lg:hidden"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <aside
            id={menuId}
              className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,16rem)] flex-col border-r border-white/10 bg-expert-sidebar px-4 py-4 text-expert-sidebar-foreground shadow-2xl lg:hidden"
          >
            <div className="mb-4 flex h-10 shrink-0 items-center justify-between">
              <span className="text-sm font-semibold">Menu</span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-sm transition-colors hover:bg-white/10"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <NavInner onNavigate={closeMenu} onLogout={logout} />
            </div>
          </aside>
        </>
      ) : null}

      {/* Main content — only this area scrolls */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:pl-64">
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
