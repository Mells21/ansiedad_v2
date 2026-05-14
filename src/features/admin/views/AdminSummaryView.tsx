import { GovernanceChecklist } from "@/features/admin/components/GovernanceChecklist";
import { ModelOverview } from "@/features/admin/components/ModelOverview";
import { useAdminOutletContext } from "@/features/admin/views/AdminDashboardView";

export function AdminSummaryView() {
  const { admins, metrics, metricsError, metricsLoading, psychologists, reloadMetrics, students } = useAdminOutletContext();

  return (
    <div className="admin-shell">
      {metricsError ? <p className="form-error">{metricsError}</p> : null}
      <ModelOverview metrics={metrics} loading={metricsLoading} onRetry={reloadMetrics} />
      <GovernanceChecklist
        adminCount={admins.length}
        metrics={metrics}
        psychologistCount={psychologists.length}
        studentCount={students.length}
      />
    </div>
  );
}
