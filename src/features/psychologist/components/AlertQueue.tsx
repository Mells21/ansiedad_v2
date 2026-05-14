import type { StudentRisk } from "@/features/psychologist/models/student-risk.model";
import { PanelCard } from "@/shared/components/PanelCard";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface AlertQueueProps {
  alerts: StudentRisk[];
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
}

function getTone(riskLevel: "bajo" | "moderado" | "alto") {
  if (riskLevel === "alto") {
    return "danger";
  }

  if (riskLevel === "moderado") {
    return "warning";
  }

  return "success";
}

export function AlertQueue({ alerts, selectedStudentId, onSelectStudent }: AlertQueueProps) {
  const sortedAlerts = [...alerts].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "pendiente" ? -1 : 1;
    }

    return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
  });

  return (
    <PanelCard
      title="Seguimiento de Casos"
      subtitle="Visualiza los envios recientes y gestiona cada caso."
      action={<span className="pill pill--primary">{alerts.length} tests recibidos</span>}
    >
      {sortedAlerts.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "3rem" }}>
          <p className="soft-copy">No hay tests registrados para este periodo.</p>
        </div>
      ) : (
        <div className="alert-cards-grid">
          {sortedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-card alert-card--risk-${alert.riskLevel} ${
                selectedStudentId === alert.id ? "alert-card--active" : ""
              }`}
              onClick={() => onSelectStudent(alert.id)}
            >
              <div className="alert-card-header">
                <div className="alert-card-student">
                  <strong>{alert.studentName}</strong>
                  <span>{alert.gradeSection}</span>
                </div>
                <StatusBadge tone={getTone(alert.riskLevel)}>{alert.riskLevel}</StatusBadge>
              </div>

              <div className="alert-card-body">
                <div className="alert-card-meta">
                  <label>Test</label>
                  <span>DASS-21</span>
                </div>
                <div className="alert-card-meta">
                  <label>Resultado</label>
                  <span>{alert.latestLabel}</span>
                </div>
                <div className="alert-card-meta">
                  <label>Puntaje</label>
                  <span>{alert.latestScore} pts</span>
                </div>
                <div className="alert-card-meta">
                  <label>Enviado</label>
                  <span>{new Date(alert.submittedAt).toLocaleDateString("es-PE")}</span>
                </div>
              </div>

              <div className="alert-card-footer">
                <div className="inline-spread" style={{ gap: "0.5rem" }}>
                  <div
                    className={`alert-status-dot ${
                      alert.status === "pendiente" ? "alert-status-dot--pending" : ""
                    }`}
                  />
                  <span className="soft-copy" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    {alert.status === "pendiente" ? "Pendiente de Revision" : "Diagnosticado"}
                  </span>
                </div>
                <button type="button" className="btn btn--ghost btn--sm" style={{ padding: "0.4rem 0.8rem" }}>
                  Ver detalle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
}
