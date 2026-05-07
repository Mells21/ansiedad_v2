import type { ModelMetrics } from "@/features/admin/models/model-metrics.model";
import { PanelCard } from "@/shared/components/PanelCard";

interface ModelOverviewProps {
  metrics: ModelMetrics | null;
}

export function ModelOverview({ metrics }: ModelOverviewProps) {
  const rows = metrics
    ? [
        { label: "Variables activas", value: String(metrics.featureCount) },
        { label: "Ultima version", value: metrics.modelVersion },
        { label: "Ultimo entrenamiento", value: new Date(metrics.lastTrainedAt).toLocaleDateString("es-PE") },
      ]
    : [
        { label: "Variables activas", value: "--" },
        { label: "Ultima version", value: "--" },
        { label: "Ultimo entrenamiento", value: "--" },
      ];

  return (
    <PanelCard
      title="Resumen del modelo"
      subtitle="Indicadores reales del modelo Python cargado por la API local."
      action={<button className="btn btn--ghost">Modelo activo</button>}
    >
      <div className="summary-grid">
        {rows.map((row) => (
          <div className="soft-panel" key={row.label}>
            <p className="summary-label">{row.label}</p>
            <strong className="summary-value">{row.value}</strong>
          </div>
        ))}
        <div className="soft-panel">
          <p className="summary-label">F1 estimado</p>
          <strong className="summary-value">
            {metrics ? `${(((metrics.precision + metrics.recall) / 2) * 100).toFixed(0)}%` : "--"}
          </strong>
        </div>
      </div>
    </PanelCard>
  );
}
