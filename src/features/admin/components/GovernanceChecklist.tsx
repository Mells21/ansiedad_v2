import { PanelCard } from "@/shared/components/PanelCard";

const checks = [
  "Auditar valores faltantes antes de reentrenar.",
  "Comparar errores del modelo por grado y seccion.",
  "Registrar cambios de variables y fecha de despliegue.",
  "Validar alertas de riesgo alto con criterio profesional.",
];

export function GovernanceChecklist() {
  return (
    <PanelCard
      title="Gobernanza y control"
      subtitle="Buenas practicas para evitar sesgos y perdida de trazabilidad."
      action={<button className="btn">Exportar auditoria</button>}
    >
      <ul className="detail-list">
        {checks.map((check) => (
          <li key={check}>{check}</li>
        ))}
      </ul>
    </PanelCard>
  );
}
