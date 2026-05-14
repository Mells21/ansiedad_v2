import { useEffect, useMemo, useState } from "react";
import type { PsychologistHelpAlert } from "@/features/psychologist/models/psychologist-dashboard.model";
import {
  getPsychologistHelpAlerts,
  markHelpAlertAsIntervened,
} from "@/features/psychologist/services/psychologist.service";

export function usePsychologistAlerts() {
  const [alerts, setAlerts] = useState<PsychologistHelpAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<PsychologistHelpAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const nextAlerts = await getPsychologistHelpAlerts();
      setAlerts(nextAlerts);
      window.dispatchEvent(new CustomEvent("psychologist-help-alerts-updated"));
      setSelectedAlert((current) =>
        current ? nextAlerts.find((alert) => alert.id === current.id && alert.studentId === current.studentId) ?? null : null,
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las alertas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts().catch(() => undefined);
  }, []);

  const pendingCount = useMemo(
    () => alerts.filter((alert) => alert.status === "pendiente").length,
    [alerts],
  );

  const openAlert = (alert: PsychologistHelpAlert) => {
    setSelectedAlert(alert);
  };

  const closeAlert = () => {
    if (saving) {
      return;
    }
    setSelectedAlert(null);
  };

  const interveneSelectedAlert = async () => {
    if (!selectedAlert || selectedAlert.status === "intervenido") {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await markHelpAlertAsIntervened(selectedAlert.studentId, selectedAlert.id);
      await loadAlerts();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo actualizar la alerta.");
    } finally {
      setSaving(false);
    }
  };

  return {
    alerts,
    closeAlert,
    error,
    interveneSelectedAlert,
    loading,
    openAlert,
    pendingCount,
    reloadAlerts: loadAlerts,
    saving,
    selectedAlert,
  };
}
