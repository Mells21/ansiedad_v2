import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "@/features/auth/services/auth.service";
import { StudentAssessmentWizard } from "@/features/student/components/StudentAssessmentWizard";
import { StudentAssessmentSummary } from "@/features/student/components/StudentAssessmentSummary";
import { StudentRecommendations } from "@/features/student/components/StudentRecommendations";
import { TestHistoryPanel } from "@/features/student/components/TestHistoryPanel";
import { useStudentDashboard } from "@/features/student/controllers/useStudentDashboard";

export function StudentDashboardView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"inicio" | "test" | "historial">("inicio");
  const {
    currentStep,
    detail,
    error,
    form,
    isTestLocked,
    loading,
    nextStep,
    nextAvailableTestLabel,
    previousStep,
    submittedNow,
    submit,
    updateAnswer,
    updateField,
  } = useStudentDashboard();

  const latestAssessment = detail?.latestAssessment;
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSubmit = async () => {
    const saved = await submit();

    if (saved) {
      setActiveTab("historial");
    }
  };

  return (
    <section className="page student-page">
      <header className="student-header">
        <div className="student-header-profile">
          <div className="student-header-avatar">o</div>
          <div>
            <h1 className="student-header-title">Panel del Estudiante</h1>
            <p className="student-header-name">{detail?.student.fullName ?? form.fullName}</p>
          </div>
        </div>
        <button className="student-logout" type="button" onClick={handleLogout}>
          Cerrar Sesion
        </button>
      </header>

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
              <p>Este espacio esta disenado para ayudarte a monitorear tu bienestar emocional.</p>
            </section>

            <div className="student-home-grid">
              <article className="student-home-card">
                <div className="student-home-icon student-home-icon--blue">+</div>
                <h3>Test Psicologico</h3>
                <p>
                  {isTestLocked
                    ? `Tu ultimo test ya fue enviado. Podras responder otro desde el ${nextAvailableTestLabel}.`
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
                    : "Bienestar emocional"}
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
            submittedNow={submittedNow}
          />
          <TestHistoryPanel history={detail?.history ?? []} />
          <StudentRecommendations detail={detail} />
        </div>
      ) : null}
    </section>
  );
}
