import type { StudentCaseDetail } from "@/features/student/models/student-case.model";
import { PanelCard } from "@/shared/components/PanelCard";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface StudentSummaryProps {
  detail: StudentCaseDetail | null;
}

function getTone(status: StudentCaseDetail["status"] | "empty") {
  if (status === "diagnosticado") {
    return "success";
  }

  if (status === "pendiente_diagnostico") {
    return "warning";
  }

  return "neutral";
}

export function StudentSummary({ detail }: StudentSummaryProps) {
  const status = detail?.status ?? "empty";
  const latestAssessment = detail?.latestAssessment;
  const statusCopy =
    status === "diagnosticado"
      ? "Tu ficha ya fue revisada por psicologia."
      : status === "pendiente_diagnostico"
        ? "Tus respuestas ya estan guardadas y esperan revision del psicologo."
        : "Completa el test para dejar tu ficha lista para revision.";

  return (
    <PanelCard
      title="Estado de tu ficha"
      subtitle="Aqui puedes ver si tu test ya fue enviado y en que punto del proceso se encuentra."
      action={<StatusBadge tone={getTone(status)}>Seguimiento</StatusBadge>}
    >
      <div className="summary-grid">
        <div className="soft-panel">
          <p className="summary-label">Situacion actual</p>
          <strong className="summary-value">
            {status === "diagnosticado"
              ? "Revisado por psicologia"
              : status === "pendiente_diagnostico"
                ? "Enviado para revision"
                : "Aun no enviado"}
          </strong>
          <p className="soft-copy">{statusCopy}</p>
        </div>
        <div className="soft-panel">
          <p className="summary-label">Tu ultimo test</p>
          <strong className="summary-value">
            {latestAssessment ? `${latestAssessment.preliminaryLabel} (${latestAssessment.normalizedScore})` : "--"}
          </strong>
          <p className="soft-copy">
            {latestAssessment
              ? "El sistema usa esta informacion junto con las variables del psicologo para el diagnostico final."
              : "Cuando completes el test, veras aqui tu ultimo registro enviado."}
          </p>
        </div>
      </div>
    </PanelCard>
  );
}
