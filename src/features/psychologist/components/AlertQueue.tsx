import type { StudentRisk } from "@/features/psychologist/models/student-risk.model";
import { PanelCard } from "@/shared/components/PanelCard";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface AlertQueueProps {
  alerts: StudentRisk[];
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
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

export function AlertQueue({ alerts, selectedStudentId, onSelectStudent }: AlertQueueProps) {
  const sortedAlerts = [...alerts].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "pendiente" ? -1 : 1;
    }

    return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
  });

  return (
    <PanelCard
      title="Nuevos tests"
      subtitle="Vista de envios recientes al estilo del modulo de estudiantes del admin."
      action={<span className="pill">{alerts.length} tests</span>}
    >
      {sortedAlerts.length === 0 ? (
        <p className="soft-copy">Todavia no hay tests enviados por estudiantes.</p>
      ) : (
        <div className="admin-students-table-shell psychologist-tests-table-shell">
          <table className="admin-students-table psychologist-tests-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Grado</th>
                <th>Test</th>
                <th>Riesgo</th>
                <th>Envio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sortedAlerts.map((alert) => (
                <tr
                  className={selectedStudentId === alert.id ? "psychologist-tests-row psychologist-tests-row--active" : "psychologist-tests-row"}
                  key={alert.id}
                  onClick={() => onSelectStudent(alert.id)}
                >
                  <td>
                    <strong>{alert.studentName}</strong>
                  </td>
                  <td>{alert.gradeSection}</td>
                  <td>{alert.latestLabel} ({alert.latestScore})</td>
                  <td>
                    <StatusBadge tone={getTone(alert.riskLevel)}>{alert.riskLevel}</StatusBadge>
                  </td>
                  <td>{new Date(alert.submittedAt).toLocaleDateString("es-PE")}</td>
                  <td>{alert.status === "pendiente" ? "Nuevo test" : "Diagnosticado"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelCard>
  );
}
