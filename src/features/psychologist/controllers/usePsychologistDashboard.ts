import { useEffect, useState } from "react";
import type { StudentCaseDetail } from "@/features/student/models/student-case.model";
import type {
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

export function usePsychologistDashboard() {
  const [dashboard, setDashboard] = useState<PsychologistDashboardData | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<StudentCaseDetail | null>(null);
  const [diagnosisForm, setDiagnosisForm] = useState<PsychologistDiagnosisForm>(initialForm);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submittingDiagnosis, setSubmittingDiagnosis] = useState(false);
  const [savingRecommendations, setSavingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (selectedStudentId === null) {
      return;
    }

    setLoadingDetail(true);
    getStudentDetail(selectedStudentId)
      .then((detail) => {
        setSelectedDetail(detail);
        setDiagnosisForm({
          notas: detail.latestDiagnosis?.notas ?? initialForm.notas,
          conducta: detail.latestDiagnosis?.conducta ?? initialForm.conducta,
          inasistencias: detail.latestDiagnosis?.inasistencias ?? initialForm.inasistencias,
          recommendations: Array.isArray(detail.latestDiagnosis?.recommendations)
            ? detail.latestDiagnosis.recommendations.join("\n")
            : "",
        });
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "No se pudo abrir el caso del alumno.");
      })
      .finally(() => {
        setLoadingDetail(false);
      });
  }, [selectedStudentId]);

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
    if (selectedStudentId === null) {
      return;
    }

    setSubmittingDiagnosis(true);
    setError(null);

    try {
      const detail = await diagnoseStudent(selectedStudentId, diagnosisForm);
      setSelectedDetail(detail);
      await loadDashboard();
    } catch (diagnosisError) {
      setError(diagnosisError instanceof Error ? diagnosisError.message : "No se pudo registrar el diagnostico.");
    } finally {
      setSubmittingDiagnosis(false);
    }
  };

  const submitRecommendations = async () => {
    if (selectedStudentId === null) {
      return;
    }

    setSavingRecommendations(true);
    setError(null);

    try {
      const detail = await saveDiagnosisRecommendations(selectedStudentId, diagnosisForm.recommendations);
      setSelectedDetail(detail);
      setDiagnosisForm((current) => ({
        ...current,
        recommendations: Array.isArray(detail.latestDiagnosis?.recommendations)
          ? detail.latestDiagnosis.recommendations.join("\n")
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
