import { GovernanceChecklist } from "@/features/admin/components/GovernanceChecklist";
import { ModelOverview } from "@/features/admin/components/ModelOverview";
import { useAdminOutletContext } from "@/features/admin/views/AdminDashboardView";

export function AdminSummaryView() {
  const { metrics, metricsError } = useAdminOutletContext();

  return (
    <div className="admin-shell">
      {metricsError ? <p className="form-error">{metricsError}</p> : null}
      <ModelOverview metrics={metrics} />
      <GovernanceChecklist />
    </div>
  );
}
