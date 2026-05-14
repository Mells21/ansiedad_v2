import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StudentAssessmentWizard } from "@/features/student/components/StudentAssessmentWizard";
import { StudentHelpRequestModal } from "@/features/student/components/StudentHelpRequestModal";
import { StudentHelpResponsesPanel } from "@/features/student/components/StudentHelpResponsesPanel";
import { StudentTestHistoryDetailModal } from "@/features/student/components/StudentTestHistoryDetailModal";
import { TestHistoryPanel } from "@/features/student/components/TestHistoryPanel";
import { useStudentDashboard } from "@/features/student/controllers/useStudentDashboard";
import type { StudentHistoryItem } from "@/features/student/models/student-case.model";

export function StudentDashboardView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<StudentHistoryItem | null>(null);
  const {
    currentStep,
    closeHelpModal,
    detail,
    error,
    form,
    helpModalOpen,
    helpRequestError,
    helpRequestForm,
    helpRequestLoading,
    helpRequestSuccess,
    helpRequests,
    isTestLocked,
    loading,
    markHelpInboxAsSeen,
    nextStep,
    nextAvailableTestLabel,
    testAvailabilityDetail,
    openHelpModal,
    previousStep,
    resetAssessmentDraft,
    submit,
    submitHelpRequest,
    unreadHelpResponsesCount,
    updateAnswer,
    updateField,
    updateHelpRequestField,
  } = useStudentDashboard();

  const requestedTab = searchParams.get("tab");
  const activeTab: "inicio" | "test" | "historial" | "ayuda" =
    requestedTab === "test" || requestedTab === "historial" || requestedTab === "ayuda" ? requestedTab : "inicio";

  const latestAssessment = detail?.latestAssessment;
  const latestHelpRequest = detail?.latestHelpRequest;

  useEffect(() => {
    if (!requestedTab) {
      setSearchParams({ tab: "inicio" }, { replace: true });
    }
  }, [requestedTab, setSearchParams]);

  useEffect(() => {
    if (activeTab === "ayuda") {
      markHelpInboxAsSeen();
    }
  }, [activeTab, markHelpInboxAsSeen]);

  const handleSubmit = async () => {
    const saved = await submit();

    if (saved) {
      setSearchParams({ tab: "historial" });
    }
  };

  const openTestTab = () => {
    if (!isTestLocked) {
      resetAssessmentDraft();
    }
    setSearchParams({ tab: isTestLocked ? "historial" : "test" });
  };

  return (
    <section className="page student-page">
      {activeTab === "inicio" ? (
        <div className="student-home-shell">
          <section className="student-welcome-card">
            <h2>Bienvenido, {detail?.student.fullName ?? (form.fullName || "Estudiante")}</h2>
            <p>En este espacio puedes revisar tus evaluaciones y dar seguimiento a tu estado actual.</p>
          </section>

          <section className="student-help-card">
            <div className="student-help-card-copy">
              <span className="student-help-badge">SOS</span>
              <h3>Necesitas hablar con el psicologo?</h3>
              <p>
                Si te sientes sobrepasado, puedes enviar una solicitud confidencial y quedara registrada para
                seguimiento.
              </p>
              {helpRequestSuccess ? <p className="student-help-feedback">{helpRequestSuccess}</p> : null}
              {latestHelpRequest ? (
                <div className="student-help-meta">
                  Ultima solicitud: {latestHelpRequest.reason} · {latestHelpRequest.urgency} ·{" "}
                  {new Date(latestHelpRequest.submittedAt).toLocaleDateString("es-PE")}
                </div>
              ) : null}
              {latestHelpRequest?.psychologistRecommendation ? (
                <div className="student-note-box">
                  <strong>Respuesta del psicologo</strong>
                  <p>{latestHelpRequest.psychologistRecommendation}</p>
                </div>
              ) : null}
            </div>

            <button className="student-help-cta" type="button" onClick={openHelpModal}>
              Pedir ayuda
            </button>
          </section>

          <div className="student-home-grid">
            <article className="student-home-card">
              <div className="student-home-icon student-home-icon--blue">+</div>
              <h3>Test Psicologico</h3>
              <p>
                {isTestLocked
                  ? nextAvailableTestLabel
                    ? `Tu ultimo test ya fue enviado. Podras responder otro desde el ${nextAvailableTestLabel}.`
                    : testAvailabilityDetail
                  : "Completa un test rapido para evaluar tu nivel de ansiedad actual."}
              </p>
              <button className="student-link-btn" type="button" onClick={openTestTab}>
                {isTestLocked ? "Ver resumen" : "Realizar test"}
              </button>
            </article>

            <article className="student-home-card">
              <div className="student-home-icon student-home-icon--violet">o</div>
              <h3>Historial</h3>
              <p>Revisa tus tests anteriores y el estado de revision del psicologo.</p>
              <button className="student-link-btn" type="button" onClick={() => setSearchParams({ tab: "historial" })}>
                Ver historial
              </button>
            </article>

            <article className="student-home-card">
              <div className="student-home-icon student-home-icon--blue">!</div>
              <h3>Ayuda y respuestas</h3>
              <p>
                Revisa tus solicitudes de apoyo y las respuestas del psicologo.
                {unreadHelpResponsesCount > 0 ? ` Tienes ${unreadHelpResponsesCount} respuesta${unreadHelpResponsesCount === 1 ? "" : "s"} nueva${unreadHelpResponsesCount === 1 ? "" : "s"}.` : ""}
              </p>
              <button className="student-link-btn" type="button" onClick={() => setSearchParams({ tab: "ayuda" })}>
                Ver bandeja
              </button>
            </article>
          </div>

          <section className="student-note-card">
            <h3>Ultima Recomendacion</h3>
            <div className="student-note-box">
              <strong>
                {latestAssessment
                  ? `${latestAssessment.preliminaryLabel} - ${new Date(latestAssessment.submittedAt).toLocaleDateString("es-PE")}`
                  : "Seguimiento personal"}
              </strong>
              <p>
                {latestHelpRequest?.psychologistRecommendation ??
                  detail?.recommendations[0] ??
                  "Practica tecnicas de respiracion profunda antes de situaciones que te generen tension."}
              </p>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "test" ? (
        <div className="student-test-shell">
          <StudentAssessmentWizard
            currentStep={currentStep}
            form={form}
            loading={loading}
            error={error}
            isLocked={isTestLocked}
            nextAvailableTestLabel={nextAvailableTestLabel}
            availabilityDetail={testAvailabilityDetail}
            onAnswerChange={updateAnswer}
            onFieldChange={updateField}
            onNext={nextStep}
            onPrevious={previousStep}
            onViewHistory={() => setSearchParams({ tab: "historial" })}
            onSubmit={handleSubmit}
          />
        </div>
      ) : null}

      {activeTab === "historial" ? (
        <div className="student-history-shell">
          <TestHistoryPanel
            history={detail?.history ?? []}
            onSelect={setSelectedHistoryItem}
            selectedAssessmentId={selectedHistoryItem?.assessmentId ?? null}
          />
        </div>
      ) : null}

      {activeTab === "ayuda" ? (
        <div className="student-history-shell">
          <StudentHelpResponsesPanel helpRequests={helpRequests} unreadCount={unreadHelpResponsesCount} />
        </div>
      ) : null}

      {helpModalOpen ? (
        <StudentHelpRequestModal
          error={helpRequestError}
          form={helpRequestForm}
          loading={helpRequestLoading}
          onClose={closeHelpModal}
          onFieldChange={updateHelpRequestField}
          onSubmit={submitHelpRequest}
        />
      ) : null}

      {selectedHistoryItem ? (
        <StudentTestHistoryDetailModal item={selectedHistoryItem} onClose={() => setSelectedHistoryItem(null)} />
      ) : null}
    </section>
  );
}
