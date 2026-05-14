import { useMemo, useState } from "react";
import { PsychologistAlertDetailModal } from "@/features/psychologist/components/PsychologistAlertDetailModal";
import { PsychologistAlertsBoard } from "@/features/psychologist/components/PsychologistAlertsBoard";
import { usePsychologistAlerts } from "@/features/psychologist/controllers/usePsychologistAlerts";

type AlertFilter = "all" | "pending" | "intervened" | "high";

function KpiCard({
  label,
  value,
  sublabel,
  color,
  icon,
  active,
  onClick,
}: {
  label: string;
  value: string;
  sublabel: string;
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
      style={{ outline: active ? `2px solid ${color}` : undefined }}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="stats-kpi-top">
        <span className="stats-kpi-icon" style={{ background: `${color}18`, color }}>
          {icon}
        </span>
        <p className="stats-kpi-label">{label}</p>
      </div>
      <strong className="stats-kpi-value" style={{ color }}>
        {value}
      </strong>
      <p className="stats-kpi-sub">{sublabel}</p>
    </div>
  );
}

export function PsychologistAlertsView() {
  const {
    alerts,
    closeAlert,
    error,
    interveneSelectedAlert,
    loading,
    openAlert,
    pendingCount,
    saving,
    selectedAlert,
  } = usePsychologistAlerts();
  const [activeFilter, setActiveFilter] = useState<AlertFilter>("all");
  const intervenedCount = alerts.length - pendingCount;
  const highUrgencyCount = alerts.filter((alert) => alert.urgency === "alto").length;
  const filteredAlerts = useMemo(() => {
    if (activeFilter === "pending") {
      return alerts.filter((alert) => alert.status === "pendiente");
    }
    if (activeFilter === "intervened") {
      return alerts.filter((alert) => alert.status === "intervenido");
    }
    if (activeFilter === "high") {
      return alerts.filter((alert) => alert.urgency === "alto");
    }
    return alerts;
  }, [activeFilter, alerts]);

  const toggleFilter = (filter: AlertFilter) => {
    setActiveFilter((current) => (current === filter ? "all" : filter));
  };

  return (
    <section className="page psychologist-page psychologist-page--alerts">
      <div className="stats-shell">
        <div className="stats-kpi-grid">
          <KpiCard
            active={activeFilter === "all"}
            color="#ef4444"
            icon="AT"
            label="Alertas Totales"
            onClick={() => setActiveFilter("all")}
            sublabel="solicitudes registradas en la bandeja"
            value={String(alerts.length)}
          />
          <KpiCard
            active={activeFilter === "pending"}
            color="#f59e0b"
            icon="PE"
            label="Pendientes"
            onClick={() => toggleFilter("pending")}
            sublabel="requieren seguimiento o contacto"
            value={String(pendingCount)}
          />
          <KpiCard
            active={activeFilter === "intervened"}
            color="#10b981"
            icon="IN"
            label="Intervenidas"
            onClick={() => toggleFilter("intervened")}
            sublabel="ya fueron marcadas como atendidas"
            value={String(intervenedCount)}
          />
          <KpiCard
            active={activeFilter === "high"}
            color="#dc2626"
            icon="UA"
            label="Urgencia Alta"
            onClick={() => toggleFilter("high")}
            sublabel="casos que deben revisarse primero"
            value={String(highUrgencyCount)}
          />
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <PsychologistAlertsBoard
          alerts={filteredAlerts}
          onSelect={openAlert}
          pendingCount={filteredAlerts.filter((alert) => alert.status === "pendiente").length}
          selectedAlertKey={selectedAlert ? `${selectedAlert.studentId}-${selectedAlert.id}` : null}
        />

        {loading ? (
          <div className="soft-panel psychologist-alerts-loading">
            <p className="soft-copy">Cargando alertas de ayuda...</p>
          </div>
        ) : null}
      </div>

      {selectedAlert ? (
        <PsychologistAlertDetailModal
          alert={selectedAlert}
          loading={saving}
          onClose={closeAlert}
          onIntervene={interveneSelectedAlert}
        />
      ) : null}
    </section>
  );
}
