import { useEffect, useState } from "react";
import { getTestScheduleConfig, updateTestScheduleConfig } from "@/features/student/services/test-config.service";
import type { TestScheduleConfig, TestPeriodicity } from "@/features/student/models/test-config.model";

const GRADES = ["1", "2", "3", "4", "5"];
const SECTIONS = ["A", "B", "C", "D"];

const PERIODICITY_OPTIONS: { value: TestPeriodicity; label: string; desc: string; icon: string }[] = [
  { value: "libre",      label: "Libre",       desc: "Sin restricción de tiempo",        icon: "∞" },
  { value: "mensual",    label: "Mensual",      desc: "1 test por mes",                   icon: "1M" },
  { value: "bimestral",  label: "Bimestral",   desc: "1 test cada 2 meses",              icon: "2M" },
  { value: "trimestral", label: "Trimestral",  desc: "1 test cada 3 meses",              icon: "3M" },
];

const initialConfig: TestScheduleConfig = {
  periodicity: "mensual",
  isActive: true,
  targetGrades: [],
  targetSections: [],
  targetStudentIds: [],
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  updatedAt: new Date().toISOString(),
};

export function TestSchedulerView() {
  const [config, setConfig] = useState<TestScheduleConfig>(initialConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getTestScheduleConfig()
      .then((saved) => { if (saved) setConfig(saved); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateTestScheduleConfig(config);
      setMessage({ type: "success", text: "Configuración guardada correctamente." });
      setTimeout(() => setMessage(null), 4000);
    } catch {
      setMessage({ type: "error", text: "No se pudo guardar la configuración." });
    } finally {
      setSaving(false);
    }
  };

  const toggleGrade = (g: string) =>
    setConfig(c => ({
      ...c,
      targetGrades: c.targetGrades.includes(g)
        ? c.targetGrades.filter(x => x !== g)
        : [...c.targetGrades, g],
    }));

  const toggleSection = (s: string) =>
    setConfig(c => ({
      ...c,
      targetSections: c.targetSections.includes(s)
        ? c.targetSections.filter(x => x !== s)
        : [...c.targetSections, s],
    }));

  if (loading) {
    return (
      <div className="sched-loading">
        <div className="sched-spinner" />
        <p>Cargando configuración...</p>
      </div>
    );
  }

  const daysLeft = config.endDate
    ? Math.max(0, Math.ceil((new Date(config.endDate).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="sched-shell psychologist-scheduler-shell">
      <div className="sched-body">
        {/* ── LEFT PANEL ── */}
        <div className="sched-left">

          {/* Toggle principal */}
          <div className="sched-card sched-toggle-card">
            <div className="sched-card-title-row">
              <span className="sched-card-icon">EG</span>
              <div>
                <h3 className="sched-card-title">Estado Global</h3>
                <p className="sched-card-sub">Activa o desactiva el test para todos los estudiantes</p>
              </div>
              <div className={`sched-status-badge ${config.isActive ? "sched-status-badge--on" : "sched-status-badge--off"}`}>
                <span className="sched-status-dot" />
                {config.isActive ? "Test Activo" : "Test Cerrado"}
              </div>
            </div>
            <div className="sched-toggle-wrap">
              <button
                type="button"
                className={`sched-toggle ${config.isActive ? "sched-toggle--on" : ""}`}
                onClick={() => setConfig(c => ({ ...c, isActive: !c.isActive }))}
                aria-pressed={config.isActive}
              >
                <span className="sched-toggle-thumb" />
              </button>
              <span className="sched-toggle-label">
                {config.isActive ? "Habilitado para estudiantes" : "Deshabilitado (cerrado)"}
              </span>
            </div>
          </div>

          {/* Periodicidad */}
          <div className="sched-card">
            <div className="sched-card-title-row">
              <span className="sched-card-icon">PR</span>
              <div>
                <h3 className="sched-card-title">Periodicidad</h3>
                <p className="sched-card-sub">Frecuencia con la que un estudiante puede completar el test</p>
              </div>
            </div>
            <div className="sched-period-grid">
              {PERIODICITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`sched-period-btn ${config.periodicity === opt.value ? "sched-period-btn--active" : ""}`}
                  onClick={() => setConfig(c => ({ ...c, periodicity: opt.value }))}
                >
                  <span className="sched-period-icon">{opt.icon}</span>
                  <strong>{opt.label}</strong>
                  <span>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fechas */}
          <div className="sched-card">
            <div className="sched-card-title-row">
              <span className="sched-card-icon">FC</span>
              <div>
                <h3 className="sched-card-title">Ventana de Disponibilidad</h3>
                <p className="sched-card-sub">Período en el que el test estará accesible</p>
              </div>
            </div>
            <div className="sched-dates-grid">
              <label className="sched-date-field">
                <span>Fecha de apertura</span>
                <input
                  type="date"
                  value={config.startDate.split("T")[0]}
                  onChange={e => setConfig(c => ({ ...c, startDate: e.target.value }))}
                />
              </label>
              <label className="sched-date-field">
                <span>Fecha de cierre</span>
                <input
                  type="date"
                  value={config.endDate.split("T")[0]}
                  onChange={e => setConfig(c => ({ ...c, endDate: e.target.value }))}
                />
              </label>
            </div>
            {daysLeft !== null && (
              <div className={`sched-days-left ${daysLeft <= 3 ? "sched-days-left--warn" : ""}`}>
                <span>{daysLeft === 0 ? "Vence hoy" : `${daysLeft} días restantes`}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="sched-right">

          {/* Grados */}
          <div className="sched-card">
            <div className="sched-card-title-row">
              <span className="sched-card-icon">GR</span>
              <div>
                <h3 className="sched-card-title">Grados Autorizados</h3>
                <p className="sched-card-sub">
                  {config.targetGrades.length === 0
                    ? "Vacío = todos los grados habilitados"
                    : `${config.targetGrades.length} grado(s) seleccionado(s)`}
                </p>
              </div>
            </div>
            <div className="sched-chips">
              {GRADES.map(g => (
                <button
                  key={g}
                  type="button"
                  className={`sched-chip ${config.targetGrades.includes(g) ? "sched-chip--active" : ""}`}
                  onClick={() => toggleGrade(g)}
                >
                  {config.targetGrades.includes(g) && <span className="sched-chip-check">OK</span>}
                  {g}° Grado
                </button>
              ))}
            </div>
            {config.targetGrades.length === 0 && (
              <p className="sched-all-label">Todos los grados habilitados</p>
            )}
          </div>

          {/* Secciones */}
          <div className="sched-card">
            <div className="sched-card-title-row">
              <span className="sched-card-icon">SC</span>
              <div>
                <h3 className="sched-card-title">Secciones Autorizadas</h3>
                <p className="sched-card-sub">
                  {config.targetSections.length === 0
                    ? "Vacío = todas las secciones habilitadas"
                    : `${config.targetSections.length} sección(es) seleccionada(s)`}
                </p>
              </div>
            </div>
            <div className="sched-chips">
              {SECTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`sched-chip ${config.targetSections.includes(s) ? "sched-chip--active" : ""}`}
                  onClick={() => toggleSection(s)}
                >
                  {config.targetSections.includes(s) && <span className="sched-chip-check">OK</span>}
                  Sección {s}
                </button>
              ))}
            </div>
            {config.targetSections.length === 0 && (
              <p className="sched-all-label">Todas las secciones habilitadas</p>
            )}
          </div>

          {/* Summary & Save */}
          <div className="sched-card sched-summary-card">
            <h3 className="sched-card-title" style={{ marginBottom: "var(--space-3)" }}>Resumen de Configuración</h3>
            <p className="soft-copy" style={{ marginBottom: "1rem" }}>
              Esta configuracion es la que usa el modulo del alumno para decidir si el test esta disponible y cuando puede volver a responderlo.
            </p>
            <div className="sched-summary-grid">
              <div className="sched-summary-row">
                <span>Estado</span>
                <strong style={{ color: config.isActive ? "#10b981" : "#ef4444" }}>
                  {config.isActive ? "Activo" : "Inactivo"}
                </strong>
              </div>
              <div className="sched-summary-row">
                <span>Periodicidad</span>
                <strong>{PERIODICITY_OPTIONS.find(o => o.value === config.periodicity)?.label}</strong>
              </div>
              <div className="sched-summary-row">
                <span>Desde</span>
                <strong>{new Date(config.startDate).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</strong>
              </div>
              <div className="sched-summary-row">
                <span>Hasta</span>
                <strong>{new Date(config.endDate).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</strong>
              </div>
              <div className="sched-summary-row">
                <span>Grados</span>
                <strong>{config.targetGrades.length === 0 ? "Todos" : config.targetGrades.map(g => `${g}°`).join(", ")}</strong>
              </div>
              <div className="sched-summary-row">
                <span>Secciones</span>
                <strong>{config.targetSections.length === 0 ? "Todas" : config.targetSections.join(", ")}</strong>
              </div>
            </div>

            {message && (
              <div className={`sched-message ${message.type === "success" ? "sched-message--ok" : "sched-message--err"}`}>
                {message.type === "success" ? "✓" : "✗"} {message.text}
              </div>
            )}

            <button
              className="sched-save-btn"
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <><span className="sched-btn-spinner" /> Guardando...</>
              ) : (
                "Guardar configuración"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
