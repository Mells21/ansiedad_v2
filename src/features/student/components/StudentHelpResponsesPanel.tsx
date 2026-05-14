import type { StudentHelpRequest } from "@/features/student/models/student-case.model";
import { PanelCard } from "@/shared/components/PanelCard";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface StudentHelpResponsesPanelProps {
  helpRequests: StudentHelpRequest[];
  unreadCount: number;
}

function getStatusTone(request: StudentHelpRequest) {
  return request.psychologistRecommendation ? "success" : request.status === "pendiente" ? "warning" : "success";
}

function getStatusLabel(request: StudentHelpRequest) {
  if (request.psychologistRecommendation) {
    return "Respondida por psicologia";
  }
  return request.status === "intervenido" ? "Atendida sin nota" : "Pendiente de respuesta";
}

export function StudentHelpResponsesPanel({ helpRequests, unreadCount }: StudentHelpResponsesPanelProps) {
  return (
    <PanelCard
      title="Solicitudes de ayuda"
      action={
        <span className="student-card-tag">
          {unreadCount > 0
            ? `${unreadCount} nueva${unreadCount === 1 ? "" : "s"}`
            : `${helpRequests.length} registro${helpRequests.length === 1 ? "" : "s"}`}
        </span>
      }
      className="student-history-card"
    >
      {helpRequests.length === 0 ? (
        <div className="student-history-empty">
          <strong>Aun no has enviado solicitudes de ayuda.</strong>
          <span>Cuando pidas apoyo, aqui podras ver el estado y la respuesta del psicologo.</span>
        </div>
      ) : (
        <div className="student-history-list">
          {helpRequests.map((request) => {
            const submittedAt = new Date(request.submittedAt);

            return (
              <article key={String(request.id)} className="student-history-record student-help-response-record">
                <div className="student-history-date">
                  <strong>{submittedAt.toLocaleDateString("es-PE", { day: "2-digit" })}</strong>
                  <span>{submittedAt.toLocaleDateString("es-PE", { month: "short", year: "numeric" })}</span>
                </div>

                <div className="student-history-result student-help-response-record__summary">
                  <StatusBadge tone={getStatusTone(request)}>{getStatusLabel(request)}</StatusBadge>
                  <span>{request.reason}</span>
                </div>

                <div className="student-history-metric">
                  <span>Urgencia</span>
                  <strong style={{ textTransform: "capitalize" }}>{request.urgency}</strong>
                </div>

                <div className="student-history-metric student-help-response-record__reply">
                  <span>Respuesta</span>
                  <strong>{request.psychologistRecommendation?.trim() ? "Disponible" : "Pendiente"}</strong>
                </div>

                <div className="student-help-response-record__content">
                  <div className="student-help-response-record__block">
                    <span>Tu mensaje</span>
                    <p>{request.message.trim() || "Sin mensaje adicional"}</p>
                  </div>
                  <div className="student-help-response-record__block">
                    <span>Respuesta del psicologo</span>
                    <p>{request.psychologistRecommendation?.trim() || "Aun no hay una respuesta registrada."}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}
