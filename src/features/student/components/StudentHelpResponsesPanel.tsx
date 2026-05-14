import type { StudentHelpRequest } from "@/features/student/models/student-case.model";
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
    return "Respondida";
  }
  return request.status === "intervenido" ? "Atendida" : "Pendiente";
}

export function StudentHelpResponsesPanel({ helpRequests, unreadCount }: StudentHelpResponsesPanelProps) {
  return (
    <section className="card student-help-history-card">
      <div className="card-head">
        <div>
          <h3 className="card-title">Solicitudes de ayuda</h3>
          <p className="card-subtitle">Revisa tus pedidos de apoyo y las respuestas que te deje psicologia.</p>
        </div>
        <span className="student-card-tag">
          {unreadCount > 0 ? `${unreadCount} nueva${unreadCount === 1 ? "" : "s"}` : `${helpRequests.length} registro${helpRequests.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {helpRequests.length === 0 ? (
        <div className="student-history-empty">
          <strong>Aun no has enviado solicitudes de ayuda.</strong>
          <span>Cuando pidas apoyo, aqui podras ver el estado y la respuesta del psicologo.</span>
        </div>
      ) : (
        <div className="student-help-response-list">
          {helpRequests.map((request) => (
            <article key={String(request.id)} className="student-help-response-item">
              <div className="student-help-response-item__top">
                <div>
                  <strong>{request.reason}</strong>
                  <p>
                    {new Date(request.submittedAt).toLocaleDateString("es-PE")} · urgencia {request.urgency}
                  </p>
                </div>
                <StatusBadge tone={getStatusTone(request)}>{getStatusLabel(request)}</StatusBadge>
              </div>

              <div className="student-help-response-item__body">
                <div className="student-help-response-item__block">
                  <span>Tu mensaje</span>
                  <p>{request.message.trim() || "Sin mensaje adicional"}</p>
                </div>
                <div className="student-help-response-item__block">
                  <span>Respuesta del psicologo</span>
                  <p>{request.psychologistRecommendation?.trim() || "Aun no hay una respuesta registrada."}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
