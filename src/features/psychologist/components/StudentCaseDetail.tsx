import { useState } from "react";
import type { StudentCaseDetail } from "@/features/student/models/student-case.model";
import type { PsychologistDiagnosisForm } from "@/features/psychologist/models/psychologist-dashboard.model";

interface StudentCaseDetailProps {
  detail: StudentCaseDetail | null;
  diagnosisForm: PsychologistDiagnosisForm;
  loading: boolean;
  savingRecommendations: boolean;
  submitting: boolean;
  onDiagnosisFieldChange: <TKey extends keyof PsychologistDiagnosisForm>(
    field: TKey,
    value: PsychologistDiagnosisForm[TKey],
  ) => void;
  onSubmitDiagnosis: () => void;
  onSubmitRecommendations: () => void;
}

// ── Config de riesgo ──────────────────────────────────────────────────────────
const RISK = {
  alto:     { label: "Riesgo Alto",     color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "#ef4444" },
  moderado: { label: "Riesgo Moderado", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "#f59e0b" },
  bajo:     { label: "Riesgo Bajo",     color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "#10b981" },
};

// ── Helpers visuales ──────────────────────────────────────────────────────────
function RiskBadge({ risk }: { risk: "bajo" | "moderado" | "alto" }) {
  const r = RISK[risk];
  return (
    <span
      className="cd-risk-badge"
      style={{ color: r.color, background: r.bg, border: `1px solid ${r.border}` }}
    >
      {r.label}
    </span>
  );
}

function ScoreGauge({ score, risk }: { score: number; risk: "bajo" | "moderado" | "alto" }) {
  const r = RISK[risk];
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="cd-gauge-wrap">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="9" />
        <circle
          cx="60" cy="60" r="46"
          fill="none"
          stroke={r.color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 46}`}
          strokeDashoffset={`${2 * Math.PI * 46 * (1 - pct / 100)}`}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
        />
        <text x="60" y="56" textAnchor="middle" fontSize="24" fontWeight="800" fill={r.color}>{score}</text>
        <text x="60" y="72" textAnchor="middle" fontSize="10" fill="#94a3b8">/100</text>
      </svg>
      <span className="cd-gauge-label" style={{ color: r.color, background: r.bg }}>{r.label}</span>
    </div>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="cd-prob-row">
      <div className="cd-prob-meta">
        <span className="cd-prob-label">{label}</span>
        <strong className="cd-prob-pct" style={{ color }}>{pct}%</strong>
      </div>
      <div className="cd-prob-track">
        <div className="cd-prob-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function DataRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="cd-data-row">
      <span className="cd-data-icon">{icon}</span>
      <div className="cd-data-body">
        <span className="cd-data-label">{label}</span>
        <strong className="cd-data-value">{value}</strong>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function StudentCaseDetail({
  detail,
  diagnosisForm,
  loading,
  savingRecommendations,
  submitting,
  onDiagnosisFieldChange,
  onSubmitDiagnosis,
  onSubmitRecommendations,
}: StudentCaseDetailProps) {
  const [activeTab, setActiveTab] = useState<"diagnosis" | "context" | "history">("diagnosis");

  if (loading) {
    return (
      <div className="cd-state">
        <div className="cd-spinner" />
        <p>Cargando caso clínico…</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="cd-state">
        <span style={{ fontSize: "2.5rem", fontWeight: 700 }}>TC</span>
        <p>Selecciona un estudiante del listado.</p>
      </div>
    );
  }

  const { student, latestAssessment, latestDiagnosis, history } = detail;
  const isDiagnosed = Boolean(latestDiagnosis);
  const activeRisk  = latestDiagnosis?.riskLevel ?? latestAssessment?.preliminaryRisk ?? "bajo";
  const activeLabel = latestDiagnosis?.predictedLabel ?? latestAssessment?.preliminaryLabel ?? "--";
  const score       = latestAssessment?.normalizedScore ?? 0;
  const riskCfg     = RISK[activeRisk];

  const canDiagnose =
    Boolean(latestAssessment) &&
    !isDiagnosed &&
    diagnosisForm.notas >= 0 &&
    diagnosisForm.conducta >= 0 &&
    diagnosisForm.inasistencias >= 0;

  const diagRecs   = Array.isArray(latestDiagnosis?.recommendations) ? latestDiagnosis!.recommendations : [];
  const diagProbs  = latestDiagnosis?.probabilities ?? [];

  const TABS = [
    { id: "diagnosis" as const, label: "Diagnóstico", icon: "DG" },
    { id: "context"   as const, label: "Contexto",    icon: "CT" },
    { id: "history"   as const, label: "Historial",   icon: "HS" },
  ];

  return (
    <div className="cd-root">

      {/* ══ HERO ═══════════════════════════════════════════════════════════ */}
      <div className="cd-hero" style={{ borderBottom: `3px solid ${riskCfg.border}` }}>

        {/* Avatar + identidad */}
        <div className="cd-identity">
          <div className="cd-avatar" style={{ background: riskCfg.bg, color: riskCfg.color }}>
            {student.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="cd-name">{student.fullName}</h2>
            <div className="cd-meta-row">
              <span>Código: {student.code}</span>
              <span>Grado: {student.gradeSection}</span>
              {student.gender && (
                <span>
                  Sexo: {student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}
                </span>
              )}
            </div>
            <div className="cd-badges-row">
              <span
                className="cd-status-badge"
                style={{
                  background: isDiagnosed ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                  color: isDiagnosed ? "#10b981" : "#f59e0b",
                }}
              >
                {isDiagnosed ? "Diagnosticado" : "Pendiente"}
              </span>
              {latestAssessment && (
                <span className="cd-date-badge">
                  Fecha: {new Date(latestAssessment.submittedAt).toLocaleDateString("es-PE", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score gauge */}
        <ScoreGauge score={score} risk={activeRisk} />
      </div>

      {/* ══ RESULT BANNER ══════════════════════════════════════════════════ */}
      <div className="cd-result-banner" style={{ background: riskCfg.bg, borderLeftColor: riskCfg.border }}>
        <div>
          <p className="cd-result-eyebrow">
            {isDiagnosed ? "Diagnóstico final · revisión clínica" : "Resultado preliminar · DASS-21"}
          </p>
          <p className="cd-result-label" style={{ color: riskCfg.color }}>{activeLabel}</p>
        </div>
        <div className="cd-result-pills">
          <div className="cd-result-pill">
            <span>DASS-21 raw</span>
            <strong>{latestAssessment?.rawScore ?? "—"}</strong>
          </div>
          {isDiagnosed && latestDiagnosis && (
            <div className="cd-result-pill">
              <span>Emitido</span>
              <strong>{new Date(latestDiagnosis.diagnosedAt).toLocaleDateString("es-PE")}</strong>
            </div>
          )}
        </div>
      </div>

      {/* ══ TABS ═══════════════════════════════════════════════════════════ */}
      <div className="cd-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`cd-tab ${activeTab === t.id ? "cd-tab--active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: DIAGNÓSTICO ═══════════════════════════════════════════════ */}
      {activeTab === "diagnosis" && (
        <div className="cd-body fade-in">

          {/* Probabilidades del modelo */}
          {isDiagnosed && diagProbs.length > 0 && (
            <section className="cd-section">
              <h4 className="cd-section-title">Probabilidades del modelo</h4>
              <div className="cd-probs">
                {diagProbs.map((p) => (
                  <ProbBar
                    key={p.label}
                    label={p.label}
                    value={p.value}
                    color={p.label === "Alto" ? "#ef4444" : p.label === "Moderado" ? "#f59e0b" : "#10b981"}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Variables registradas (si ya está diagnosticado) */}
          {isDiagnosed && latestDiagnosis && (
            <section className="cd-section">
              <h4 className="cd-section-title">Variables escolares registradas</h4>
              <div className="cd-data-grid">
                <DataRow icon="NT" label="Notas"
                  value={["C — En proceso", "B — Logro esperado", "A — Logro destacado", "AD — Sobresaliente"][latestDiagnosis.notas - 1] ?? String(latestDiagnosis.notas)} />
                <DataRow icon="🎭" label="Conducta"
                  value={["Mala", "Regular", "Buena"][latestDiagnosis.conducta] ?? String(latestDiagnosis.conducta)} />
                <DataRow icon="🚫" label="Inasistencias"
                  value={["Normal (0–2)", "Regular (3–4)", "Grave (5+)"][latestDiagnosis.inasistencias] ?? String(latestDiagnosis.inasistencias)} />
              </div>
            </section>
          )}

          {/* Formulario para emitir diagnóstico */}
          {!isDiagnosed && (
            <section className="cd-section">
              <h4 className="cd-section-title">Variables escolares</h4>
              <p className="cd-hint">
                Completa los tres campos para cruzar el test DASS-21 con el desempeño escolar y emitir el diagnóstico final.
              </p>
              <div className="cd-form-grid">

                <label className="cd-field">
                  <span className="cd-field-label">Notas</span>
                  <select className="cd-select" value={diagnosisForm.notas}
                    onChange={(e) => onDiagnosisFieldChange("notas", Number(e.target.value))}>
                    <option value={-1}>Seleccionar…</option>
                    <option value={1}>C — En proceso</option>
                    <option value={2}>B — Logro esperado</option>
                    <option value={3}>A — Logro destacado</option>
                    <option value={4}>AD — Sobresaliente</option>
                  </select>
                </label>

                <label className="cd-field">
                  <span className="cd-field-label">🎭 Conducta</span>
                  <select className="cd-select" value={diagnosisForm.conducta}
                    onChange={(e) => onDiagnosisFieldChange("conducta", Number(e.target.value))}>
                    <option value={-1}>Seleccionar…</option>
                    <option value={0}>Mala</option>
                    <option value={1}>Regular</option>
                    <option value={2}>Buena</option>
                  </select>
                </label>

                <label className="cd-field">
                  <span className="cd-field-label">🚫 Inasistencias</span>
                  <select className="cd-select" value={diagnosisForm.inasistencias}
                    onChange={(e) => onDiagnosisFieldChange("inasistencias", Number(e.target.value))}>
                    <option value={-1}>Seleccionar…</option>
                    <option value={0}>Normal (0–2)</option>
                    <option value={1}>Regular (3–4)</option>
                    <option value={2}>Grave (5 o más)</option>
                  </select>
                </label>
              </div>

              <div className="cd-diagnose-row">
                <button
                  className="cd-btn-primary"
                  type="button"
                  onClick={onSubmitDiagnosis}
                  disabled={submitting || !canDiagnose}
                >
                  {submitting
                    ? <><span className="btn-spinner" /> Procesando…</>
                    : "Emitir diagnóstico final"}
                </button>
                {!canDiagnose && (
                  <p className="cd-warn">Completa los tres campos para activar el diagnóstico.</p>
                )}
              </div>
            </section>
          )}

          {/* Recomendaciones */}
          {isDiagnosed && (
            <section className="cd-section">
              <h4 className="cd-section-title">Recomendaciones al estudiante</h4>

              {diagRecs.length > 0 && (
                <ul className="cd-recs-list">
                  {diagRecs.map((rec, i) => (
                    <li key={i} className="cd-rec-item">
                      <span className="cd-rec-dot" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              )}

              <label className="cd-field" style={{ marginTop: "0.75rem" }}>
                <span className="cd-field-label">Agregar / actualizar recomendaciones</span>
                <textarea
                  className="cd-textarea"
                  rows={3}
                  value={diagnosisForm.recommendations}
                  onChange={(e) => onDiagnosisFieldChange("recommendations", e.target.value)}
                  placeholder="Una recomendación por línea…"
                />
              </label>

              <button
                className="cd-btn-ghost"
                type="button"
                onClick={onSubmitRecommendations}
                disabled={savingRecommendations}
              >
                {savingRecommendations ? "Guardando…" : "Guardar recomendaciones"}
              </button>
            </section>
          )}
        </div>
      )}

      {/* ══ TAB: CONTEXTO ══════════════════════════════════════════════════ */}
      {activeTab === "context" && (
        <div className="cd-body fade-in">
          <section className="cd-section">
            <h4 className="cd-section-title">Entorno familiar</h4>
            <div className="cd-data-grid">
              <DataRow icon="VF" label="Vive con"
                value={student.livesWithParents ? "Sus padres" : "Otros tutores"} />
              <DataRow icon="SE" label="Situación económica"
                value={["", "Baja", "Media", "Alta"][student.economicSituation] ?? String(student.economicSituation)} />
            </div>
          </section>

          <section className="cd-section">
            <h4 className="cd-section-title">Hábitos y rutina</h4>
            <div className="cd-data-grid">
              <DataRow icon="HS" label="Horas de sueño" value={`${student.sleepHours}h por noche`} />
              <DataRow icon="HE" label="Horas de estudio" value={`${student.studyHours}h diarias`} />
              <DataRow icon="AE" label="Actividades extracurriculares" value={`Frecuencia ${student.extracurricularFrequency}`} />
            </div>
          </section>
        </div>
      )}

      {/* ══ TAB: HISTORIAL ═════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div className="cd-body fade-in">
          <section className="cd-section">
            <h4 className="cd-section-title">Historial de tests</h4>

            {history.length > 0 ? (
              <div className="cd-timeline">
                {history.map((item, idx) => {
                  const cfg = RISK[item.preliminaryRisk];
                  return (
                    <div className="cd-tl-item" key={item.assessmentId}>
                      <div className="cd-tl-line" style={{ background: idx === history.length - 1 ? "transparent" : "var(--color-border-muted)" }} />
                      <div className="cd-tl-dot" style={{ background: cfg.color, boxShadow: `0 0 0 4px ${cfg.bg}` }} />
                      <div className="cd-tl-card">
                        <div className="cd-tl-top">
                          <strong className="cd-tl-date">
                            {new Date(item.submittedAt).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
                          </strong>
                          <RiskBadge risk={item.preliminaryRisk} />
                        </div>
                        <div className="cd-tl-meta">
                          <span>DASS-21: <strong>{item.rawScore} pts</strong></span>
                          <span style={{ color: item.status === "diagnosticado" ? "#10b981" : "#f59e0b" }}>
                            {item.status === "diagnosticado" ? "Diagnosticado" : "Pendiente"}
                          </span>
                        </div>
                        {item.finalLabel && (
                          <p className="cd-tl-final">
                            Diagnóstico final: <strong>{item.finalLabel}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="cd-empty-history">
                <span>HS</span>
                <p>No hay historial previo para este estudiante.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ══ OVERLAY DE PROCESAMIENTO ═══════════════════════════════════════ */}
      {submitting && (
        <div className="case-processing-overlay">
          <div className="case-processing-card">
            <div className="case-processing-spinner" />
            <h3>Procesando diagnóstico</h3>
            <p>El sistema está analizando las variables del estudiante para generar el resultado final.</p>
          </div>
        </div>
      )}
    </div>
  );
}
