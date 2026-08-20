import { AdminAuthGuard } from "@/components/layout/AdminAuthGuard";
import { AdminShell } from "@/components/layout/AdminShell";
import { ToastProvider } from "@/components/ui/Toast";
import { Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <ToastProvider>
      <AdminAuthGuard>
        <AdminShell>
          <Outlet />
        </AdminShell>
      </AdminAuthGuard>
    </ToastProvider>
  );
}
