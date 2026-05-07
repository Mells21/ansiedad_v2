import type { StudentHistoryItem } from "@/features/student/models/student-case.model";
import { PanelCard } from "@/shared/components/PanelCard";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface TestHistoryPanelProps {
  history: StudentHistoryItem[];
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

export function TestHistoryPanel({ history }: TestHistoryPanelProps) {
  return (
    <PanelCard title="Historial de test" subtitle="Tus envios recientes y si ya fueron revisados por psicologia.">
      <div className="timeline-list">
        {history.length === 0 ? (
          <p className="soft-copy">Todavia no has enviado ningun test.</p>
        ) : (
          history.map((item) => (
            <div className="timeline-item" key={item.assessmentId}>
              <div className="timeline-dot" />
              <div className="timeline-content">
                <div className="inline-spread">
                  <strong>{new Date(item.submittedAt).toLocaleDateString("es-PE")}</strong>
                  <StatusBadge tone={getTone(item.preliminaryRisk)}>{item.preliminaryLabel}</StatusBadge>
                </div>
                <p className="soft-copy">
                  Puntaje DASS ansiedad: {item.rawScore} | Escala del modelo: {item.normalizedScore}
                </p>
                <p className="soft-copy">
                  Estado: {item.status === "diagnosticado" ? "Revisado por psicologia" : "Pendiente de revision"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </PanelCard>
  );
}
