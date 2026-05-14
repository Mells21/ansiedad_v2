import { Outlet, useOutletContext } from "react-router-dom";
import { useAdminDashboard } from "@/features/admin/controllers/useAdminDashboard";
import type { AdminOutletContextValue } from "@/features/admin/models/admin-outlet-context.model";

export function AdminDashboardView() {
  const dashboard = useAdminDashboard();

  return (
    <section className="admin-page">
      <Outlet context={dashboard} />
    </section>
  );
}

export function useAdminOutletContext() {
  return useOutletContext<AdminOutletContextValue>();
}
