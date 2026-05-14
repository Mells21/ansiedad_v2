import type { StudentCaseDetail } from "@/features/student/models/student-case.model";
import { PanelCard } from "@/shared/components/PanelCard";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface StudentAssessmentSummaryProps {
  detail: StudentCaseDetail | null;
  nextAvailableTestLabel: string | null;
  availabilityDetail?: string | null;
  submittedNow?: boolean;
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

export function StudentAssessmentSummary({
  detail,
  nextAvailableTestLabel,
  availabilityDetail = null,
  submittedNow = false,
}: StudentAssessmentSummaryProps) {
  const latestAssessment = detail?.latestAssessment;
  const psychologistRecommendations = detail?.latestDiagnosis?.recommendations ?? [];
  const recommendations =
    psychologistRecommendations.length > 0 ? psychologistRecommendations : (detail?.recommendations ?? []);

  if (!latestAssessment) {
    return (
      <PanelCard
        title="Resumen del ultimo test"
        subtitle="Cuando completes tu primer test, aqui veras el resultado preliminar y los siguientes pasos."
      >
        <p className="soft-copy">Todavia no hay un resultado registrado.</p>
      </PanelCard>
    );
  }

  return (
    <PanelCard
      title={submittedNow ? "Test enviado correctamente" : "Resumen de tu ultimo test"}
      subtitle={
        submittedNow
          ? "Tu evaluacion ya fue registrada y ahora forma parte de tu historial."
          : "Este es el ultimo resultado preliminar guardado en tu historial."
      }
      className="student-summary-card"
      action={<StatusBadge tone={getTone(latestAssessment.preliminaryRisk)}>{latestAssessment.preliminaryLabel}</StatusBadge>}
    >
      <div className="student-summary-hero">
        <div className="student-summary-score">
          <p className="summary-label">Puntaje preliminar</p>
          <strong className="student-summary-score-value">{latestAssessment.normalizedScore}</strong>
          <p className="soft-copy">
            Test enviado el {new Date(latestAssessment.submittedAt).toLocaleDateString("es-PE")}
          </p>
        </div>

        <div className="student-summary-grid">
          <div className="soft-panel">
            <p className="summary-label">Escala DASS ansiedad</p>
            <strong className="summary-value">{latestAssessment.rawScore}</strong>
          </div>
          <div className="soft-panel">
            <p className="summary-label">Proximo test disponible</p>
            <strong className="summary-value">{nextAvailableTestLabel ?? "Disponible ahora"}</strong>
            {availabilityDetail ? <p className="soft-copy">{availabilityDetail}</p> : null}
          </div>
        </div>
      </div>

      <div className="student-summary-recommendations">
        <p className="summary-label">
          {psychologistRecommendations.length > 0 ? "Recomendaciones del psicologo" : "Recomendaciones inmediatas"}
        </p>
        <ul className="list">
          {recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}
        </ul>
      </div>
    </PanelCard>
  );
}
