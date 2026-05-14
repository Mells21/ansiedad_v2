import type { StudentHistoryItem } from "@/features/student/models/student-case.model";
import { PanelCard } from "@/shared/components/PanelCard";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface TestHistoryPanelProps {
  history: StudentHistoryItem[];
  onSelect: (item: StudentHistoryItem) => void;
  selectedAssessmentId?: string | number | null;
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

function getStatusLabel(status: "diagnosticado" | "pendiente") {
  return status === "diagnosticado" ? "Revisado por psicologia" : "Pendiente de revision";
}

export function TestHistoryPanel({ history, onSelect, selectedAssessmentId = null }: TestHistoryPanelProps) {
  return (
    <PanelCard
      title="Historial de test"
      action={<span className="student-card-tag">{history.length} registro{history.length === 1 ? "" : "s"}</span>}
      className="student-history-card"
    >
      {history.length === 0 ? (
        <div className="student-history-empty">
          <strong>Sin test registrados</strong>
          <span>Cuando envies uno, aparecera aqui.</span>
        </div>
      ) : (
        <div className="student-history-list">
          {history.map((item) => {
            const submittedAt = new Date(item.submittedAt);

            return (
              <button
                className={
                  selectedAssessmentId === item.assessmentId
                    ? "student-history-record student-history-record--active"
                    : "student-history-record"
                }
                key={item.assessmentId}
                type="button"
                onClick={() => onSelect(item)}
              >
                <div className="student-history-date">
                  <strong>{submittedAt.toLocaleDateString("es-PE", { day: "2-digit" })}</strong>
                  <span>{submittedAt.toLocaleDateString("es-PE", { month: "short", year: "numeric" })}</span>
                </div>

                <div className="student-history-result">
                  <StatusBadge tone={getTone(item.preliminaryRisk)}>{item.preliminaryLabel}</StatusBadge>
                  <span>{getStatusLabel(item.status)}</span>
                </div>

                <div className="student-history-metric">
                  <span>Puntaje</span>
                  <strong>{item.normalizedScore}</strong>
                </div>

                <div className="student-history-metric student-history-metric--secondary">
                  <span>DASS</span>
                  <strong>{item.rawScore}</strong>
                </div>

                <span className="student-history-open" aria-hidden="true">Ver</span>
              </button>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}
