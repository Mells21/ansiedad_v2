import type { PsychologistHelpAlert } from "@/features/psychologist/models/psychologist-dashboard.model";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface PsychologistAlertsBoardProps {
  alerts: PsychologistHelpAlert[];
  onSelect: (alert: PsychologistHelpAlert) => void;
  pendingCount: number;
  selectedAlertKey: string | null;
}

function getUrgencyTone(urgency: PsychologistHelpAlert["urgency"]) {
  if (urgency === "alto") {
    return "danger";
  }
  if (urgency === "medio") {
    return "warning";
  }
  return "success";
}

function getStatusLabel(status: PsychologistHelpAlert["status"]) {
  return status === "pendiente" ? "Pendiente" : "Intervenido";
}

export function PsychologistAlertsBoard({
  alerts,
  onSelect,
  pendingCount,
  selectedAlertKey,
}: PsychologistAlertsBoardProps) {
  return (
    <article className="stats-chart-card psychologist-alerts-board">
      <div className="stats-chart-header psychologist-alerts-board__header">
        <div>
          <h3 className="stats-chart-title">Bandeja de alertas</h3>
          <p className="stats-chart-sub">
            Solicitudes de ayuda enviadas desde el módulo del alumno.
          </p>
        </div>
        <span className="dash-count-pill">{pendingCount} pendientes</span>
      </div>

      {alerts.length === 0 ? (
        <div className="glass-panel psychologist-alerts-board__empty">
          <p className="soft-copy">No hay alertas registradas por ahora.</p>
        </div>
      ) : (
        <div className="student-alerts-grid">
          {alerts.map((alert) => (
            <button
              key={`${alert.studentId}-${alert.id}`}
              className={
                selectedAlertKey === `${alert.studentId}-${alert.id}`
                  ? "student-alert-card student-alert-card--active"
                  : "student-alert-card"
              }
              type="button"
              onClick={() => onSelect(alert)}
            >
              <span
                className={`student-alert-card-accent student-alert-card-accent--${alert.urgency}`}
                aria-hidden="true"
              />
              <div className="student-alert-card-top">
                <div className="student-alert-card-student">
                  <strong>{alert.studentName}</strong>
                  <span>{alert.gradeSection}</span>
                </div>
                <StatusBadge tone={getUrgencyTone(alert.urgency)}>{alert.urgency}</StatusBadge>
              </div>

              <div className="student-alert-card-copy">
                <span className="student-alert-card-label">Motivo</span>
                <strong>{alert.reason}</strong>
                <p>{alert.message.trim() || "Sin mensaje adicional"}</p>
              </div>

              <div className="student-alert-card-footer">
                <span>{new Date(alert.submittedAt).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}</span>
                <span className={alert.status === "pendiente" ? "student-alert-status" : "student-alert-status student-alert-status--done"}>
                  {getStatusLabel(alert.status)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
