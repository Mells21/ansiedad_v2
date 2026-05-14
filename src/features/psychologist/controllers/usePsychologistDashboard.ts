import { useEffect, useRef, useState } from "react";
import type { StudentCaseDetail } from "@/features/student/models/student-case.model";
import type {
  PsychologistAlert,
  PsychologistDashboardData,
  PsychologistDiagnosisForm,
} from "@/features/psychologist/models/psychologist-dashboard.model";
import {
  diagnoseStudent,
  getPsychologistDashboard,
  getStudentDetail,
  saveDiagnosisRecommendations,
} from "@/features/psychologist/services/psychologist.service";

const initialForm: PsychologistDiagnosisForm = {
  notas: -1,
  conducta: -1,
  inasistencias: -1,
  recommendations: "",
};

/**
 * Construye un StudentCaseDetail parcial a partir de los datos del alert
 * que ya están en memoria. Permite mostrar el modal de forma instantánea
 * mientras el detalle completo carga en segundo plano.
 */
function buildOptimisticDetail(alert: PsychologistAlert): StudentCaseDetail {
  return {
    student: {
      id: alert.id,
      code: "",
      fullName: alert.studentName,
      gradeSection: alert.gradeSection,
      livesWithParents: true,
      parentsValue: 0,
      economicSituation: 0,
      sleepHours: 0,
      sleepValue: 0,
      extracurricularFrequency: 0,
      studyHours: 0,
      studyValue: 0,
      createdAt: "",
      updatedAt: "",
    },
    latestAssessment: {
      id: "",
      answers: [],
      rawScore: alert.latestScore,
      normalizedScore: alert.latestScore,
      preliminaryLabel: alert.latestLabel,
      preliminaryRisk: alert.riskLevel,
      submittedAt: alert.submittedAt,
    },
    latestDiagnosis: null,
    latestHelpRequest: null,
    history: [],
    helpRequests: [],
    recommendations: [],
    status: alert.status === "pendiente" ? "pendiente_diagnostico" : "diagnosticado",
  };
}

export function usePsychologistDashboard() {
  const [dashboard, setDashboard] = useState<PsychologistDashboardData | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<StudentCaseDetail | null>(null);
  const [diagnosisForm, setDiagnosisForm] = useState<PsychologistDiagnosisForm>(initialForm);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submittingDiagnosis, setSubmittingDiagnosis] = useState(false);
  const [savingRecommendations, setSavingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache de detalles ya cargados: studentId → StudentCaseDetail
  const detailCache = useRef<Map<string, StudentCaseDetail>>(new Map());

  const loadDashboard = async () => {
    const data = await getPsychologistDashboard();
    setDashboard(data);
  };

  useEffect(() => {
    loadDashboard().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el panel del psicologo.");
    });
  }, []);

  useEffect(() => {
    if (selectedStudentId === null) return;

    // 1. Si ya está en caché → mostrar instantáneamente, sin spinner
    const cached = detailCache.current.get(selectedStudentId);
    if (cached) {
      setSelectedDetail(cached);
      setDiagnosisForm({
        notas: cached.latestDiagnosis?.notas ?? initialForm.notas,
        conducta: cached.latestDiagnosis?.conducta ?? initialForm.conducta,
        inasistencias: cached.latestDiagnosis?.inasistencias ?? initialForm.inasistencias,
        recommendations: Array.isArray(cached.latestDiagnosis?.recommendations)
          ? cached.latestDiagnosis!.recommendations.join("\n")
          : "",
      });
      return;
    }

    // 2. Prefill optimista: mostrar datos del alert sin spinner
    const alertData = dashboard?.alerts.find((a) => a.id === selectedStudentId);
    if (alertData) {
      setSelectedDetail(buildOptimisticDetail(alertData));
      setLoadingDetail(false); // no bloquear el modal
    } else {
      setLoadingDetail(true); // no hay datos previos → spinner normal
    }

    // 3. Fetch completo en background (silencioso si ya hay prefill)
    getStudentDetail(selectedStudentId)
      .then((detail) => {
        detailCache.current.set(selectedStudentId, detail);
        setSelectedDetail(detail);
        setDiagnosisForm({
          notas: detail.latestDiagnosis?.notas ?? initialForm.notas,
          conducta: detail.latestDiagnosis?.conducta ?? initialForm.conducta,
          inasistencias: detail.latestDiagnosis?.inasistencias ?? initialForm.inasistencias,
          recommendations: Array.isArray(detail.latestDiagnosis?.recommendations)
            ? detail.latestDiagnosis!.recommendations.join("\n")
            : "",
        });
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "No se pudo abrir el caso del alumno.");
      })
      .finally(() => {
        setLoadingDetail(false);
      });
  }, [selectedStudentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateDiagnosisField = <TKey extends keyof PsychologistDiagnosisForm>(
    field: TKey,
    value: PsychologistDiagnosisForm[TKey],
  ) => {
    setDiagnosisForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const closeSelectedDetail = () => {
    setSelectedStudentId(null);
    setSelectedDetail(null);
    setError(null);
  };

  const submitDiagnosis = async () => {
    if (selectedStudentId === null) return;

    setSubmittingDiagnosis(true);
    setError(null);

    try {
      const detail = await diagnoseStudent(selectedStudentId, diagnosisForm);
      // Actualizar caché con el resultado fresco del diagnóstico
      detailCache.current.set(selectedStudentId, detail);
      setSelectedDetail(detail);
      await loadDashboard();
    } catch (diagnosisError) {
      setError(diagnosisError instanceof Error ? diagnosisError.message : "No se pudo registrar el diagnostico.");
    } finally {
      setSubmittingDiagnosis(false);
    }
  };

  const submitRecommendations = async () => {
    if (selectedStudentId === null) return;

    setSavingRecommendations(true);
    setError(null);

    try {
      const detail = await saveDiagnosisRecommendations(selectedStudentId, diagnosisForm.recommendations);
      detailCache.current.set(selectedStudentId, detail);
      setSelectedDetail(detail);
      setDiagnosisForm((current) => ({
        ...current,
        recommendations: Array.isArray(detail.latestDiagnosis?.recommendations)
          ? detail.latestDiagnosis!.recommendations.join("\n")
          : current.recommendations,
      }));
    } catch (recommendationError) {
      setError(
        recommendationError instanceof Error
          ? recommendationError.message
          : "No se pudieron guardar las recomendaciones.",
      );
    } finally {
      setSavingRecommendations(false);
    }
  };

  return {
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
  };
}
