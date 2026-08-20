import { AdminLayout } from "@/pages/AdminLayout";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ExpertsPage = lazy(() => import("@/pages/ExpertsPage"));
const ExpertNewPage = lazy(() => import("@/pages/ExpertNewPage"));
const ExpertDetailPage = lazy(() => import("@/pages/ExpertDetailPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const UserDetailPage = lazy(() => import("@/pages/UserDetailPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const AllocationPage = lazy(() => import("@/pages/AllocationPage"));
const RefundsPage = lazy(() => import("@/pages/RefundsPage"));
const RequestsPage = lazy(() => import("@/pages/RequestsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/experts" element={<ExpertsPage />} />
          <Route path="/experts/new" element={<ExpertNewPage />} />
          <Route path="/experts/:id" element={<ExpertDetailPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/allocation" element={<AllocationPage />} />
          <Route path="/refunds" element={<RefundsPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/compare" element={<Navigate to="/reports" replace />} />
        <Route path="/" element={<Navigate to="/experts" replace />} />
        <Route path="*" element={<Navigate to="/experts" replace />} />
      </Routes>
    </Suspense>
  );
}
