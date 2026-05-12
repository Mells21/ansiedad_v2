import type { StudentCaseDetail } from "@/features/student/models/student-case.model";
import type { PsychologistDiagnosisForm } from "@/features/psychologist/models/psychologist-dashboard.model";
import { PanelCard } from "@/shared/components/PanelCard";
import { StatusBadge } from "@/shared/components/StatusBadge";

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

function getTone(risk: "bajo" | "moderado" | "alto") {
  if (risk === "alto") {
    return "danger";
  }

  if (risk === "moderado") {
    return "warning";
  }

  return "success";
}

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
  if (loading) {
    return (
      <PanelCard title="Resultado del test" subtitle="Cargando el envio seleccionado...">
        <p className="soft-copy">Preparando resultado, contexto e historial del estudiante.</p>
      </PanelCard>
    );
  }

  if (!detail) {
    return (
      <PanelCard title="Resultado del test" subtitle="Selecciona un test del panel izquierdo.">
        <p className="soft-copy">Aqui veras el resultado enviado por el estudiante y podras completar el diagnostico.</p>
      </PanelCard>
    );
  }

  const { student, latestAssessment, latestDiagnosis, history } = detail;
  const diagnosisRecommendations = Array.isArray(latestDiagnosis?.recommendations)
    ? latestDiagnosis.recommendations
    : [];
  const canDiagnose =
    Boolean(latestAssessment) &&
    !latestDiagnosis &&
    diagnosisForm.notas >= 0 &&
    diagnosisForm.conducta >= 0 &&
    diagnosisForm.inasistencias >= 0;

  return (
    <PanelCard
      title="Resultado del test"
      subtitle="Revisa el envio del estudiante, valida el contexto y completa las variables escolares para emitir el diagnostico."
      action={
        latestAssessment ? (
          <StatusBadge tone={getTone(latestAssessment.preliminaryRisk)}>
            {latestAssessment.preliminaryLabel}
          </StatusBadge>
        ) : undefined
      }
      className="psychologist-detail-card"
    >
      <div className="psychologist-detail-grid">
        <div className="soft-panel">
          <p className="summary-label">Alumno</p>
          <strong className="summary-value">{student.fullName}</strong>
          <p className="soft-copy">{student.code} | {student.gradeSection}</p>
        </div>
        <div className="soft-panel">
          <p className="summary-label">Contexto precargado</p>
          <strong className="summary-value">
            {student.livesWithParents ? "Vive con padres" : "Vive con otros tutores"}
          </strong>
          <p className="soft-copy">
            Economia: {student.economicSituation} | Sueno: {student.sleepHours}h | Extra: {student.extracurricularFrequency} | Estudio: {student.studyHours}h
          </p>
        </div>
      </div>

      {latestAssessment ? (
        <div className="soft-panel">
          <p className="summary-label">Resultado reportado por el estudiante</p>
          <strong className="summary-value">
            DASS ansiedad: {latestAssessment.rawScore} | Escala del modelo: {latestAssessment.normalizedScore}
          </strong>
          <p className="soft-copy">
            Enviado el {new Date(latestAssessment.submittedAt).toLocaleString("es-PE")}. Esta informacion ya esta guardada y no necesita ser reingresada.
          </p>
        </div>
      ) : null}

      <div className="assessment-grid">
        <label className="field">
          <span>Notas</span>
          <select
            value={diagnosisForm.notas}
            onChange={(event) => onDiagnosisFieldChange("notas", Number(event.target.value))}
          >
            <option value={-1}>Seleccionar...</option>
            <option value={1}>C</option>
            <option value={2}>B</option>
            <option value={3}>A</option>
            <option value={4}>AD</option>
          </select>
        </label>
        <label className="field">
          <span>Conducta</span>
          <select
            value={diagnosisForm.conducta}
            onChange={(event) => onDiagnosisFieldChange("conducta", Number(event.target.value))}
          >
            <option value={-1}>Seleccionar...</option>
            <option value={0}>Mala</option>
            <option value={1}>Regular</option>
            <option value={2}>Buena</option>
          </select>
        </label>
        <label className="field">
          <span>Inasistencias</span>
          <select
            value={diagnosisForm.inasistencias}
            onChange={(event) => onDiagnosisFieldChange("inasistencias", Number(event.target.value))}
          >
            <option value={-1}>Seleccionar...</option>
            <option value={0}>Normal (0 a 2)</option>
            <option value={1}>Regular (3 a 4)</option>
            <option value={2}>Grave (5 o mas)</option>
          </select>
        </label>
      </div>

      <div className="cta-row">
        <button className="btn" type="button" onClick={onSubmitDiagnosis} disabled={submitting || !canDiagnose}>
          {submitting ? "Diagnosticando..." : "Diagnosticar"}
        </button>
      </div>

      {latestAssessment && !latestDiagnosis && !canDiagnose ? (
        <p className="soft-copy">Selecciona notas, conducta e inasistencias antes de emitir el diagnostico.</p>
      ) : null}

      {latestDiagnosis ? (
        <div className="diagnosis-result-card">
          <div className="inline-spread">
            <div>
              <p className="summary-label">Diagnostico final</p>
              <strong className="summary-value">{latestDiagnosis.predictedLabel}</strong>
            </div>
            <StatusBadge tone={getTone(latestDiagnosis.riskLevel)}>{latestDiagnosis.riskLevel}</StatusBadge>
          </div>
          <p className="soft-copy">
            Emitido el {new Date(latestDiagnosis.diagnosedAt).toLocaleString("es-PE")} con las variables escolares ya completadas.
          </p>
          <label className="field">
            <span>Recomendaciones para el alumno</span>
            <textarea
              rows={5}
              value={diagnosisForm.recommendations}
              onChange={(event) => onDiagnosisFieldChange("recommendations", event.target.value)}
              placeholder="Escribe indicaciones claras, por ejemplo: hablar con su tutor, cuidar horarios de sueno, agendar seguimiento esta semana."
            />
          </label>
          <div className="cta-row">
            <button className="btn btn--secondary" type="button" onClick={onSubmitRecommendations} disabled={savingRecommendations}>
              {savingRecommendations ? "Guardando recomendaciones..." : "Guardar recomendaciones"}
            </button>
          </div>
          {diagnosisRecommendations.length > 0 ? (
            <div className="soft-panel">
              <p className="summary-label">Recomendaciones enviadas al alumno</p>
              <ul className="detail-list">
                {diagnosisRecommendations.map((recommendation) => (
                  <li key={recommendation}>{recommendation}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="probability-grid">
            {latestDiagnosis.probabilities.map((probability) => (
              <div className="soft-panel" key={probability.label}>
                <p className="summary-label">{probability.label}</p>
                <strong className="summary-value">{(probability.value * 100).toFixed(0)}%</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!latestDiagnosis ? (
        <div className="soft-panel">
          <p className="summary-label">Recomendaciones</p>
          <p className="soft-copy">Primero emite el diagnostico. Despues podras registrar recomendaciones para el alumno.</p>
        </div>
      ) : null}

      <div className="timeline-list">
        {history.map((item) => (
          <div className="timeline-item" key={item.assessmentId}>
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="inline-spread">
                <strong>{new Date(item.submittedAt).toLocaleDateString("es-PE")}</strong>
                <StatusBadge tone={getTone(item.preliminaryRisk)}>{item.preliminaryLabel}</StatusBadge>
              </div>
              <p className="soft-copy">
                Puntaje del alumno: {item.rawScore} | Estado: {item.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
