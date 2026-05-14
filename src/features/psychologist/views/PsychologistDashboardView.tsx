import { useMemo, useState } from "react";
import { usePsychologistDashboard } from "@/features/psychologist/controllers/usePsychologistDashboard";
import { AlertQueue } from "@/features/psychologist/components/AlertQueue";
import { StudentCaseDetail } from "@/features/psychologist/components/StudentCaseDetail";

type PsychologistFilter = "all" | "high" | "moderate" | "pending";

// ── KPI Card — igual al de StatsView ─────────────────────────────────────────
function KpiCard({
  label, value, sublabel, color, icon, active, onClick,
}: {
  label: string;
  value: string;
  sublabel?: string;
  color: string;
  icon: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`stats-kpi-card dash-kpi-card${active ? " dash-kpi-card--active" : ""}`}
      style={{ borderTop: `4px solid ${color}`, outline: active ? `2px solid ${color}` : undefined }}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div className="stats-kpi-top">
        <span className="stats-kpi-icon" style={{ background: `${color}18`, color }}>{icon}</span>
        <p className="stats-kpi-label">{label}</p>
      </div>
      <strong className="stats-kpi-value" style={{ color }}>{value}</strong>
      {sublabel && <p className="stats-kpi-sub">{sublabel}</p>}
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────
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

  const [activeFilter, setActiveFilter] = useState<PsychologistFilter>("all");

  const stats = dashboard?.stats;
  const filteredAlerts = useMemo(() => {
    const alerts = dashboard?.alerts ?? [];
    if (activeFilter === "high")     return alerts.filter((a) => a.riskLevel === "alto");
    if (activeFilter === "moderate") return alerts.filter((a) => a.riskLevel === "moderado");
    if (activeFilter === "pending")  return alerts.filter((a) => a.status === "pendiente");
    return alerts;
  }, [activeFilter, dashboard?.alerts]);

  const toggleFilter = (filter: PsychologistFilter) => {
    setActiveFilter((cur) => (cur === filter ? "all" : filter));
  };

  const filterLabel: Record<PsychologistFilter, string> = {
    all:      "Todos los casos registrados",
    high:     "Filtrando: riesgo alto",
    moderate: "Filtrando: riesgo moderado",
    pending:  "Filtrando: pendientes de diagnóstico",
  };

  return (
    <div className="stats-shell">


      {/* ── KPI ROW ─────────────────────────────────────────────── */}
      <div className="stats-kpi-grid">
        <KpiCard
          active={activeFilter === "high"}
          color="#ef4444"
          icon="RA"
          label="Riesgo Alto"
          onClick={() => toggleFilter("high")}
          sublabel={stats ? `de ${stats.testsThisMonth} tests este mes` : "cargando..."}
          value={stats ? String(stats.highAlerts) : "--"}
        />
        <KpiCard
          active={activeFilter === "moderate"}
          color="#f59e0b"
          icon="RM"
          label="Riesgo Moderado"
          onClick={() => toggleFilter("moderate")}
          sublabel={stats ? `de ${stats.testsThisMonth} tests este mes` : "cargando..."}
          value={stats ? String(stats.moderateAlerts) : "--"}
        />
        <KpiCard
          active={activeFilter === "all"}
          color="#6366f1"
          icon="TT"
          label="Tests Recibidos"
          onClick={() => toggleFilter("all")}
          sublabel="en el periodo actual"
          value={stats ? String(stats.testsThisMonth) : "--"}
        />
        <KpiCard
          active={activeFilter === "pending"}
          color="#10b981"
          icon="PD"
          label="Pendientes"
          onClick={() => toggleFilter("pending")}
          sublabel="esperan diagnóstico"
          value={stats ? String(stats.pendingDiagnosis) : "--"}
        />
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {/* ── QUEUE PANEL ─────────────────────────────────────────── */}
      <div className="stats-chart-card dash-queue-card">
        <div className="stats-chart-header">
          <div>
            <h3 className="stats-chart-title">Seguimiento de Casos</h3>
            <p className="stats-chart-sub">{filterLabel[activeFilter]}</p>
          </div>
          <span className="dash-count-pill">
            {filteredAlerts.length} {filteredAlerts.length === 1 ? "caso" : "casos"}
          </span>
        </div>

        <AlertQueue
          alerts={filteredAlerts}
          selectedStudentId={selectedStudentId}
          onSelectStudent={setSelectedStudentId}
        />
      </div>

      {/* ── DETAIL MODAL ────────────────────────────────────────── */}
      {selectedStudentId ? (
        <div
          className="psychologist-modal-backdrop"
          role="presentation"
          onClick={closeSelectedDetail}
        >
          <div
            aria-modal="true"
            className="psychologist-modal dash-modal-animate"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="psychologist-modal-head">
              <div>
                <p className="stats-eyebrow" style={{ marginBottom: "0.2rem" }}>Resultado del test DASS-21</p>
                <h2 className="stats-chart-title" style={{ fontSize: "1.4rem" }}>Revisión del caso</h2>
              </div>
              <button
                className="dash-modal-close"
                type="button"
                onClick={closeSelectedDetail}
                aria-label="Cerrar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
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
    </div>
  );
}
