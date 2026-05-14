import type { PsychologistHelpAlert } from "@/features/psychologist/models/psychologist-dashboard.model";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface PsychologistAlertDetailModalProps {
  alert: PsychologistHelpAlert;
  loading: boolean;
  onClose: () => void;
  onIntervene: () => void;
}

function getUrgencyLabel(urgency: PsychologistHelpAlert["urgency"]) {
  return urgency === "alto" ? "Alta" : urgency === "medio" ? "Media" : "Baja";
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

export function PsychologistAlertDetailModal({
  alert,
  loading,
  onClose,
  onIntervene,
}: PsychologistAlertDetailModalProps) {
  const submittedDate = new Date(alert.submittedAt);

  return (
    <div className="psychologist-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        aria-modal="true"
        className="psychologist-modal psychologist-alert-detail-modal dash-modal-animate"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="psychologist-modal-head">
          <div>
            <p className="stats-eyebrow" style={{ marginBottom: "0.2rem" }}>Solicitud de ayuda</p>
            <h2 className="stats-chart-title psychologist-alert-detail-modal__title">Detalle de alerta</h2>
          </div>
          <button aria-label="Cerrar" className="dash-modal-close" type="button" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="psychologist-modal-body psychologist-alert-detail-modal__body">
          <section className="psychologist-alert-detail-modal__hero">
            <div>
              <span className="psychologist-alert-detail-modal__label">Estudiante</span>
              <strong>{alert.studentName}</strong>
              <p>{alert.gradeSection}</p>
            </div>
            <div className="psychologist-alert-detail-modal__badges">
              <StatusBadge tone={getUrgencyTone(alert.urgency)}>{`Urgencia ${getUrgencyLabel(alert.urgency)}`}</StatusBadge>
              <StatusBadge tone={alert.status === "pendiente" ? "warning" : "success"}>
                {alert.status === "pendiente" ? "Pendiente" : "Intervenida"}
              </StatusBadge>
            </div>
          </section>

          <section className="psychologist-alert-detail-modal__section">
            <span className="psychologist-alert-detail-modal__label">Motivo</span>
            <p>{alert.reason}</p>
          </section>

          <section className="psychologist-alert-detail-modal__section">
            <span className="psychologist-alert-detail-modal__label">Mensaje del estudiante</span>
            <div className="psychologist-alert-detail-modal__message">
              {alert.message.trim() || "Sin mensaje adicional"}
            </div>
          </section>

          <div className="psychologist-alert-detail-modal__meta">
            <div className="soft-panel">
              <span className="psychologist-alert-detail-modal__label">Fecha de envio</span>
              <strong>{submittedDate.toLocaleDateString("es-PE", { dateStyle: "full" })}</strong>
              <p className="soft-copy">
                {submittedDate.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div className="soft-panel">
              <span className="psychologist-alert-detail-modal__label">Estado del seguimiento</span>
              <strong>{alert.status === "pendiente" ? "Esperando intervención" : "Caso atendido"}</strong>
              <p className="soft-copy">
                {alert.attendedAt
                  ? `Atendida el ${new Date(alert.attendedAt).toLocaleString("es-PE", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}`
                  : "Aún no se registró una atención."}
              </p>
            </div>
          </div>

          <div className="psychologist-alert-detail-modal__actions">
            <button className="btn btn--ghost" type="button" onClick={onClose} disabled={loading}>
              Cerrar
            </button>
            <button
              className="btn psychologist-alert-detail-modal__primary"
              type="button"
              onClick={onIntervene}
              disabled={loading || alert.status === "intervenido"}
            >
              {alert.status === "intervenido" ? "Ya intervenida" : loading ? "Guardando..." : "Marcar intervención"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
