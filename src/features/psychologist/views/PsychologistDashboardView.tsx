import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "@/features/auth/services/auth.service";
import { getCurrentSession } from "@/features/auth/services/auth.service";
import { usePsychologistDashboard } from "@/features/psychologist/controllers/usePsychologistDashboard";
import { AlertQueue } from "@/features/psychologist/components/AlertQueue";
import { StudentCaseDetail } from "@/features/psychologist/components/StudentCaseDetail";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";

type PsychologistFilter = "all" | "high" | "moderate" | "pending";

export function PsychologistDashboardView() {
  const navigate = useNavigate();
  const session = getCurrentSession();
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
  const [activeFilter, setActiveFilter] = useState<PsychologistFilter>("all");

  const stats = dashboard?.stats;
  const filteredAlerts = useMemo(() => {
    const alerts = dashboard?.alerts ?? [];

    if (activeFilter === "high") {
      return alerts.filter((alert) => alert.riskLevel === "alto");
    }

    if (activeFilter === "moderate") {
      return alerts.filter((alert) => alert.riskLevel === "moderado");
    }

    if (activeFilter === "pending") {
      return alerts.filter((alert) => alert.status === "pendiente");
    }

    return alerts;
  }, [activeFilter, dashboard?.alerts]);

  const toggleFilter = (filter: PsychologistFilter) => {
    setActiveFilter((current) => (current === filter ? "all" : filter));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <section className="page psychologist-page">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Psicologia</p>
          <h1 className="admin-title">Panel del psicologo</h1>
          <p className="admin-subtitle">
            Visualiza los nuevos tests enviados por estudiantes y abre cada resultado para revisarlo y diagnosticarlo.
          </p>
        </div>
        <div className="admin-header-actions">
          <div className="admin-session-chip">
            <strong>{session?.user.names ?? "Psicologo"}</strong>
            <span>{session?.user.code ?? "Sesion activa"}</span>
          </div>
          <button className="btn btn--ghost" type="button" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </header>

      <PageHeader
        title="Seguimiento de tests"
        subtitle="Usa los indicadores para filtrar la tabla y revisar cada caso desde el modal de detalle."
        badge={stats ? `${stats.pendingDiagnosis} pendientes` : "Sincronizando casos"}
      />

      <div className="stats-grid">
        <MetricCard
          active={activeFilter === "high"}
          label="Alertas altas"
          onClick={() => toggleFilter("high")}
          value={stats ? String(stats.highAlerts) : "--"}
          tone="danger"
        />
        <MetricCard
          active={activeFilter === "moderate"}
          label="Riesgo moderado"
          onClick={() => toggleFilter("moderate")}
          value={stats ? String(stats.moderateAlerts) : "--"}
          tone="warning"
        />
        <MetricCard
          active={activeFilter === "all"}
          label="Tests recibidos"
          onClick={() => toggleFilter("all")}
          value={stats ? String(stats.testsThisMonth) : "--"}
        />
        <MetricCard
          active={activeFilter === "pending"}
          label="Pendientes"
          onClick={() => toggleFilter("pending")}
          value={stats ? String(stats.pendingDiagnosis) : "--"}
        />
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="psychologist-tests-shell">
        <AlertQueue
          alerts={filteredAlerts}
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
