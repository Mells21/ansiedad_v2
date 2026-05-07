import { usePsychologistDashboard } from "@/features/psychologist/controllers/usePsychologistDashboard";
import { AlertQueue } from "@/features/psychologist/components/AlertQueue";
import { StudentCaseDetail } from "@/features/psychologist/components/StudentCaseDetail";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";

export function PsychologistDashboardView() {
  const {
    dashboard,
    diagnosisForm,
    error,
    loadingDetail,
    selectedDetail,
    selectedStudentId,
    closeSelectedDetail,
    setSelectedStudentId,
    submitDiagnosis,
    submitRecommendations,
    savingRecommendations,
    submittingDiagnosis,
    updateDiagnosisField,
  } = usePsychologistDashboard();

  const stats = dashboard?.stats;

  return (
    <section className="page psychologist-page">
      <PageHeader
        title="Panel del psicologo"
        subtitle="Visualiza los nuevos tests enviados por estudiantes y abre cada resultado para revisarlo y diagnosticarlo."
        badge={stats ? `${stats.pendingDiagnosis} pendientes` : "Sincronizando casos"}
      />

      <div className="stats-grid">
        <MetricCard label="Alertas altas" value={stats ? String(stats.highAlerts) : "--"} tone="danger" />
        <MetricCard label="Riesgo moderado" value={stats ? String(stats.moderateAlerts) : "--"} tone="warning" />
        <MetricCard label="Tests recibidos" value={stats ? String(stats.testsThisMonth) : "--"} />
        <MetricCard label="Pendientes" value={stats ? String(stats.pendingDiagnosis) : "--"} />
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="psychologist-tests-shell">
        <AlertQueue
          alerts={dashboard?.alerts ?? []}
          selectedStudentId={selectedStudentId}
          onSelectStudent={setSelectedStudentId}
        />
      </div>

      {selectedStudentId ? (
        <div className="psychologist-modal-backdrop" role="presentation" onClick={closeSelectedDetail}>
          <div
            aria-modal="true"
            className="psychologist-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="psychologist-modal-head">
              <div>
                <p className="admin-kicker">Resultado del test</p>
                <h2 className="admin-title psychologist-modal-title">Revision del caso</h2>
              </div>
              <button className="btn btn--ghost" type="button" onClick={closeSelectedDetail}>
                Cerrar
              </button>
            </div>

            <div className="psychologist-modal-body">
              <StudentCaseDetail
                detail={selectedDetail}
                diagnosisForm={diagnosisForm}
                loading={loadingDetail}
                savingRecommendations={savingRecommendations}
                submitting={submittingDiagnosis}
                onDiagnosisFieldChange={updateDiagnosisField}
                onSubmitDiagnosis={submitDiagnosis}
                onSubmitRecommendations={submitRecommendations}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
