import { useState } from "react";
import { StudentAssessmentWizard } from "@/features/student/components/StudentAssessmentWizard";
import { StudentAssessmentSummary } from "@/features/student/components/StudentAssessmentSummary";
import { StudentHelpRequestModal } from "@/features/student/components/StudentHelpRequestModal";
import { StudentRecommendations } from "@/features/student/components/StudentRecommendations";
import { TestHistoryPanel } from "@/features/student/components/TestHistoryPanel";
import { useStudentDashboard } from "@/features/student/controllers/useStudentDashboard";

export function StudentDashboardView() {
  const [activeTab, setActiveTab] = useState<"inicio" | "test" | "historial">("inicio");
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
    isTestLocked,
    loading,
    nextStep,
    nextAvailableTestLabel,
    testAvailabilityDetail,
    openHelpModal,
    previousStep,
    submittedNow,
    submit,
    submitHelpRequest,
    updateAnswer,
    updateField,
    updateHelpRequestField,
  } = useStudentDashboard();

  const latestAssessment = detail?.latestAssessment;
  const latestHelpRequest = detail?.latestHelpRequest;

  const handleSubmit = async () => {
    const saved = await submit();

    if (saved) {
      setActiveTab("historial");
    }
  };

  return (
    <section className="page student-page">

      <div className="student-tabs">
        <button
          className={activeTab === "inicio" ? "student-tab student-tab--active" : "student-tab"}
          type="button"
          onClick={() => setActiveTab("inicio")}
        >
          Inicio
        </button>
        <button
          className={activeTab === "test" ? "student-tab student-tab--active" : "student-tab"}
          type="button"
          onClick={() => setActiveTab("test")}
        >
          {isTestLocked ? "Test bloqueado" : "Nuevo Test"}
        </button>
        <button
          className={activeTab === "historial" ? "student-tab student-tab--active" : "student-tab"}
          type="button"
          onClick={() => setActiveTab("historial")}
        >
          Mi Historial
        </button>
      </div>

      {activeTab === "inicio" ? (
        <>
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
                <button
                  className="student-link-btn"
                  type="button"
                  onClick={() => setActiveTab(isTestLocked ? "historial" : "test")}
                >
                  {isTestLocked ? "Ver resumen" : "Realizar test"}
                </button>
              </article>

              <article className="student-home-card">
                <div className="student-home-icon student-home-icon--violet">o</div>
                <h3>Historial</h3>
                <p>Revisa tus tests anteriores y el estado de revision del psicologo.</p>
                <button className="student-link-btn" type="button" onClick={() => setActiveTab("historial")}>
                  Ver historial
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
                <p>{detail?.recommendations[0] ?? "Practica tecnicas de respiracion profunda antes de situaciones que te generen tension."}</p>
              </div>
            </section>
          </div>
        </>
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
            onViewHistory={() => setActiveTab("historial")}
            onSubmit={handleSubmit}
          />
        </div>
      ) : null}

      {activeTab === "historial" ? (
        <div className="student-history-shell">
          <StudentAssessmentSummary
            detail={detail}
            nextAvailableTestLabel={nextAvailableTestLabel}
            availabilityDetail={testAvailabilityDetail}
            submittedNow={submittedNow}
          />
          <TestHistoryPanel history={detail?.history ?? []} />
          <StudentRecommendations detail={detail} />
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
    </section>
  );
}
