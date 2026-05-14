import type { ModelMetrics } from "@/features/admin/models/model-metrics.model";
import { PanelCard } from "@/shared/components/PanelCard";

interface ModelOverviewProps {
  metrics: ModelMetrics | null;
  loading: boolean;
  onRetry: () => Promise<void>;
}

function formatPercent(value?: number) {
  return typeof value === "number" ? `${(value * 100).toFixed(0)}%` : "--";
}

export function ModelOverview({ metrics, loading, onRetry }: ModelOverviewProps) {
  const rows = [
    { label: "Variables activas", value: metrics ? String(metrics.featureCount) : "--" },
    { label: "Ultima version", value: metrics?.modelVersion ?? "--" },
    {
      label: "Ultimo entrenamiento",
      value: metrics ? new Date(metrics.lastTrainedAt).toLocaleDateString("es-PE") : "--",
    },
    { label: "Accuracy", value: formatPercent(metrics?.accuracy) },
    { label: "Precision", value: formatPercent(metrics?.precision) },
    { label: "Recall", value: formatPercent(metrics?.recall) },
    {
      label: "F1 estimado",
      value: metrics ? `${(((metrics.precision + metrics.recall) / 2) * 100).toFixed(0)}%` : "--",
    },
  ];

  return (
    <PanelCard
      title="Resumen del modelo"
      subtitle="Indicadores guardados desde el modelo Random Forest del proyecto."
      action={
        <button className="btn btn--ghost" type="button" onClick={() => void onRetry()} disabled={loading}>
          {loading ? "Cargando..." : "Volver a cargar"}
        </button>
      }
    >
      {loading ? <p className="soft-copy">Cargando indicadores guardados del modelo...</p> : null}
      <div className="summary-grid">
        {rows.map((row) => (
          <div className="soft-panel" key={row.label}>
            <p className="summary-label">{row.label}</p>
            <strong className="summary-value">{row.value}</strong>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
