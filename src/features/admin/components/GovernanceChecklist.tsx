import { PanelCard } from "@/shared/components/PanelCard";
import type { ModelMetrics } from "@/features/admin/models/model-metrics.model";
import { downloadSimpleXlsx } from "@/shared/lib/xlsx-export";

const checks = [
  "Auditar valores faltantes antes de reentrenar.",
  "Comparar errores del modelo por grado y seccion.",
  "Registrar cambios de variables y fecha de despliegue.",
  "Validar alertas de riesgo alto con criterio profesional.",
];

interface GovernanceChecklistProps {
  adminCount: number;
  metrics: ModelMetrics | null;
  psychologistCount: number;
  studentCount: number;
}

function downloadAuditReport(metrics: ModelMetrics | null, studentCount: number, psychologistCount: number, adminCount: number) {
  const generatedAt = new Date();
  const totalUsers = studentCount + psychologistCount + adminCount;
  const rows = [
    [
      { style: 1, value: "Reporte de auditoria administrativa" },
      { style: 1, value: "" },
    ],
    [
      { style: 6, value: "Generado" },
      { style: 5, value: generatedAt.toLocaleString("es-PE") },
    ],
    [
      { style: 2, value: "" },
      { style: 2, value: "" },
    ],
    [
      { style: 3, value: "Resumen de usuarios" },
      { style: 3, value: "" },
    ],
    [
      { style: 4, value: "Categoria" },
      { style: 4, value: "Cantidad" },
    ],
    [
      { style: 5, value: "Estudiantes" },
      { style: 5, value: studentCount },
    ],
    [
      { style: 5, value: "Psicologos" },
      { style: 5, value: psychologistCount },
    ],
    [
      { style: 5, value: "Administradores" },
      { style: 5, value: adminCount },
    ],
    [
      { style: 6, value: "Total usuarios" },
      { style: 6, value: totalUsers },
    ],
    [
      { style: 2, value: "" },
      { style: 2, value: "" },
    ],
    [
      { style: 3, value: "Indicadores del modelo" },
      { style: 3, value: "" },
    ],
    [
      { style: 4, value: "Indicador" },
      { style: 4, value: "Valor" },
    ],
    [
      { style: 5, value: "Accuracy" },
      { style: 5, value: metrics ? `${(metrics.accuracy * 100).toFixed(2)}%` : "No disponible" },
    ],
    [
      { style: 5, value: "Precision" },
      { style: 5, value: metrics ? `${(metrics.precision * 100).toFixed(2)}%` : "No disponible" },
    ],
    [
      { style: 5, value: "Recall" },
      { style: 5, value: metrics ? `${(metrics.recall * 100).toFixed(2)}%` : "No disponible" },
    ],
    [
      { style: 5, value: "Variables activas" },
      { style: 5, value: metrics ? metrics.featureCount : "No disponible" },
    ],
    [
      { style: 5, value: "Version" },
      { style: 5, value: metrics?.modelVersion ?? "No disponible" },
    ],
    [
      { style: 5, value: "Ultimo entrenamiento" },
      { style: 5, value: metrics ? new Date(metrics.lastTrainedAt).toLocaleString("es-PE") : "No disponible" },
    ],
    [
      { style: 2, value: "" },
      { style: 2, value: "" },
    ],
    [
      { style: 3, value: "Checklist de gobernanza" },
      { style: 3, value: "" },
    ],
    [
      { style: 4, value: "N" },
      { style: 4, value: "Control" },
    ],
    ...checks.map((check, index) => [
      { style: 5, value: index + 1 },
      { style: 7, value: check },
    ]),
  ];
  const stamp = generatedAt.toISOString().slice(0, 10);

  downloadSimpleXlsx({
    columnWidths: [28, 54],
    fileName: `auditoria-admin-${stamp}.xlsx`,
    merges: ["A1:B1", "A4:B4", "A11:B11", "A20:B20"],
    rowHeights: [26],
    rows,
    sheetName: "Auditoria",
  });
}

export function GovernanceChecklist({
  adminCount,
  metrics,
  psychologistCount,
  studentCount,
}: GovernanceChecklistProps) {
  return (
    <PanelCard
      title="Gobernanza y control"
      subtitle="Buenas practicas para evitar sesgos y perdida de trazabilidad."
      action={
        <button
          className="btn"
          type="button"
          onClick={() => downloadAuditReport(metrics, studentCount, psychologistCount, adminCount)}
        >
          Exportar auditoria
        </button>
      }
    >
      <ul className="detail-list">
        {checks.map((check) => (
          <li key={check}>{check}</li>
        ))}
      </ul>
    </PanelCard>
  );
}
