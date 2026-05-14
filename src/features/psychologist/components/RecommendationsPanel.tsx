import { PanelCard } from "@/shared/components/PanelCard";

interface RecommendationsPanelProps {
  recommendations: string[];
}

export function RecommendationsPanel({ recommendations }: RecommendationsPanelProps) {
  return (
    <PanelCard
      title="Recomendaciones del día"
      subtitle="Acciones sugeridas para sostener el flujo de atencion."
      action={<button className="btn">Seguimiento escolar</button>}
    >
      <ul className="detail-list">
        {recommendations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </PanelCard>
  );
}
