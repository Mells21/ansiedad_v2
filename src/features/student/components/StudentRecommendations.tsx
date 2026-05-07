import type { StudentCaseDetail } from "@/features/student/models/student-case.model";
import { PanelCard } from "@/shared/components/PanelCard";

interface StudentRecommendationsProps {
  detail: StudentCaseDetail | null;
}

const defaultItems = [
  "Respira con calma antes de continuar si alguna pregunta te moviliza demasiado.",
  "Responde pensando en como te has sentido ultimamente, no en un solo momento aislado.",
  "Si algo te preocupa de verdad, no esperes al resultado: conversa con el psicologo o un adulto de confianza.",
];

export function StudentRecommendations({ detail }: StudentRecommendationsProps) {
  const psychologistRecommendations = detail?.latestDiagnosis?.recommendations ?? [];
  const items = psychologistRecommendations.length > 0 ? psychologistRecommendations : (detail?.recommendations ?? defaultItems);
  const subtitle =
    psychologistRecommendations.length > 0
      ? "Indicaciones personalizadas compartidas por el psicologo para tu seguimiento."
      : "Sugerencias de apoyo basadas en tu ultimo tamizaje registrado.";

  return (
    <PanelCard
      title="Recomendaciones"
      subtitle={subtitle}
      action={<button className="btn btn--secondary">Cuidar mi bienestar</button>}
    >
      <ul className="detail-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </PanelCard>
  );
}
