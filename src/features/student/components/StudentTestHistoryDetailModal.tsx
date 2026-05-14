import type { StudentHistoryItem } from "@/features/student/models/student-case.model";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface StudentTestHistoryDetailModalProps {
  item: StudentHistoryItem;
  onClose: () => void;
}

function getTone(riskLevel: "bajo" | "moderado" | "alto") {
  if (riskLevel === "alto") return "danger";
  if (riskLevel === "moderado") return "warning";
  return "success";
}

export function StudentTestHistoryDetailModal({ item, onClose }: StudentTestHistoryDetailModalProps) {
  return (
    <div className="psychologist-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        aria-modal="true"
        className="psychologist-modal student-history-detail-modal dash-modal-animate"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="psychologist-modal-head">
          <div>
            <p className="stats-eyebrow" style={{ marginBottom: "0.2rem" }}>Historial de test</p>
            <h2 className="stats-chart-title student-history-detail-modal__title">
              Test del {new Date(item.submittedAt).toLocaleDateString("es-PE")}
            </h2>
          </div>
          <button aria-label="Cerrar" className="dash-modal-close" type="button" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="psychologist-modal-body student-history-detail-modal__body">
          <div className="student-history-detail-modal__hero">
            <div>
              <span className="summary-label">Resultado preliminar</span>
              <strong>{item.preliminaryLabel}</strong>
              <p className="soft-copy">
                Enviado el {new Date(item.submittedAt).toLocaleDateString("es-PE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <StatusBadge tone={getTone(item.preliminaryRisk)}>{item.preliminaryLabel}</StatusBadge>
          </div>

          <div className="student-history-detail-modal__grid">
            <div className="soft-panel">
              <p className="summary-label">Puntaje preliminar</p>
              <strong className="summary-value">{item.normalizedScore}</strong>
            </div>
            <div className="soft-panel">
              <p className="summary-label">Escala DASS ansiedad</p>
              <strong className="summary-value">{item.rawScore}</strong>
            </div>
            <div className="soft-panel">
              <p className="summary-label">Estado</p>
              <strong className="summary-value">
                {item.status === "diagnosticado" ? "Revisado por psicologia" : "Pendiente de revision"}
              </strong>
            </div>
            <div className="soft-panel">
              <p className="summary-label">Resultado final</p>
              <strong className="summary-value">{item.finalLabel ?? "Aun sin diagnostico"}</strong>
              {item.diagnosedAt ? (
                <p className="soft-copy">
                  Revisado el {new Date(item.diagnosedAt).toLocaleDateString("es-PE")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="student-history-detail-modal__actions">
            <button className="btn wizard-btn-primary" type="button" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
