import type { StudentIntakeFormValues } from "@/features/student/models/student-case.model";
import { PanelCard } from "@/shared/components/PanelCard";

interface StudentAssessmentWizardProps {
  currentStep: number;
  form: StudentIntakeFormValues;
  loading: boolean;
  error: string | null;
  isLocked?: boolean;
  nextAvailableTestLabel?: string | null;
  onAnswerChange: (index: number, value: number) => void;
  onFieldChange: <TKey extends keyof StudentIntakeFormValues>(
    field: TKey,
    value: StudentIntakeFormValues[TKey],
  ) => void;
  onNext: () => void;
  onPrevious: () => void;
  onViewHistory: () => void;
  onSubmit: () => void;
}

const stepLabels = ["Test", "Tu contexto"];

const answerLabels = [
  "No me paso",
  "Me paso un poco",
  "Me paso bastante",
  "Me paso mucho",
];

const questions = [
  "Senti sequedad en la boca.",
  "Tuve dificultad para respirar sin haber hecho esfuerzo fisico.",
  "Senti temblores, por ejemplo en las manos.",
  "Me preocupaba sentir panico y hacer el ridiculo.",
  "Senti que estaba cerca de entrar en panico.",
  "Senti los latidos de mi corazon aunque no hiciera esfuerzo.",
  "Tuve miedo sin una razon clara.",
  "Me costo relajarme cuando estaba nervioso o preocupado.",
  "Senti un nudo en el estomago por tension o ansiedad.",
  "Me altere facilmente por pequenas cosas.",
  "Senti que algo malo podia pasar en cualquier momento.",
  "Me senti muy sensible al estres o a la presion.",
  "Me costo recuperar la calma despues de preocuparme.",
  "Evite situaciones por miedo a ponerme muy nervioso.",
];

const contextSteps = [
  {
    key: "livesWithParents",
    eyebrow: "Convivencia",
    title: "Con quien vives la mayor parte del tiempo?",
    type: "choice",
    options: [
      { value: true, label: "Con mis padres o uno de ellos" },
      { value: false, label: "Con otros familiares o tutores" },
    ],
  },
  {
    key: "economicSituation",
    eyebrow: "Situacion economica",
    title: "En casa cuentas con lo necesario para estudiar con tranquilidad?",
    type: "choice",
    options: [
      { value: 0, label: "A veces faltan recursos importantes" },
      { value: 1, label: "Alcanzamos con algunos ajustes" },
      { value: 2, label: "Contamos con lo necesario" },
    ],
  },
  {
    key: "sleepHours",
    eyebrow: "Sueno",
    title: "Cuantas horas duermes normalmente entre semana?",
    type: "choice",
    options: [
      { value: 4, label: "Menos de 5 horas" },
      { value: 6, label: "Entre 6 y 7 horas" },
      { value: 8, label: "Entre 8 y 10 horas" },
      { value: 11, label: "Mas de 10 horas" },
    ],
  },
  {
    key: "extracurricularFrequency",
    eyebrow: "Actividades extracurriculares",
    title: "Despues de clases, participas en talleres, deportes, arte u otras actividades?",
    type: "choice",
    options: [
      { value: 0, label: "No realizo" },
      { value: 1, label: "A veces" },
      { value: 2, label: "Con frecuencia" },
    ],
  },
  {
    key: "studyHours",
    eyebrow: "Horas de estudio",
    title: "En promedio, cuantas horas estudias al dia fuera de clase?",
    type: "choice",
    options: [
      { value: 1, label: "Hasta 1 hora" },
      { value: 3, label: "Entre 2 y 3 horas" },
      { value: 5, label: "Entre 4 y 5 horas" },
      { value: 6, label: "Mas de 5 horas" },
    ],
  },
] as const;

export function StudentAssessmentWizard({
  currentStep,
  form,
  loading,
  error,
  isLocked = false,
  nextAvailableTestLabel = null,
  onAnswerChange,
  onFieldChange,
  onNext,
  onPrevious,
  onViewHistory,
  onSubmit,
}: StudentAssessmentWizardProps) {
  if (isLocked) {
    return (
      <PanelCard
        title="Tu test ya fue enviado"
        subtitle="Debes esperar 1 mes antes de responder un nuevo test."
        className="student-wizard-card student-wizard-card--compact"
      >
        <div className="student-lock-card">
          <div className="student-lock-icon">!</div>
          <div className="student-lock-copy">
            <strong>Proximo intento disponible: {nextAvailableTestLabel ?? "en 1 mes"}</strong>
            <p className="soft-copy">
              Mientras tanto, revisa tu historial y las recomendaciones que ya quedaron registradas.
            </p>
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="wizard-actions wizard-actions--single">
          <button className="btn wizard-btn-primary" type="button" onClick={onViewHistory}>
            Ir a mi historial
          </button>
        </div>
      </PanelCard>
    );
  }

  const isQuestionStep = currentStep >= 0 && currentStep <= 13;
  const isContextStep = currentStep >= 14 && currentStep <= 18;
  const questionIndex = isQuestionStep ? currentStep : -1;
  const contextIndex = isContextStep ? currentStep - 14 : -1;
  const contextStep = isContextStep ? contextSteps[contextIndex] : null;
  const visualStepIndex = isQuestionStep ? 0 : 1;
  const totalPrompts = questions.length + contextSteps.length;
  const progress = isQuestionStep
    ? ((questionIndex + 1) / totalPrompts) * 100
    : isContextStep
      ? ((questions.length + contextIndex + 1) / totalPrompts) * 100
      : 100;
  const currentContextValue = isContextStep && contextStep ? form[contextStep.key] : null;
  const canProceed = isQuestionStep
    ? form.answers[questionIndex] >= 0
    : isContextStep && contextStep
      ? currentContextValue !== null && currentContextValue !== -1
      : false;

  return (
    <PanelCard
      title={isQuestionStep ? "Test de Ansiedad" : "Tu contexto"}
      subtitle={
        isQuestionStep
          ? "Responde como te has sentido recientemente."
          : "Unas pocas preguntas mas para completar tu ficha."
      }
      action={
        <span className="student-card-tag">
          {isQuestionStep
            ? `Pregunta ${questionIndex + 1} de 14`
            : `Contexto ${contextIndex + 1} de 5`}
        </span>
      }
      className="student-wizard-card student-wizard-card--compact"
    >
      <div className="wizard-progress-shell">
        <div className="wizard-progress-track">
          <div className="wizard-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        {isQuestionStep || isContextStep ? (
          <div className="inline-spread">
            <span className="soft-copy">{isQuestionStep ? "Avance del test" : "Avance del contexto"}</span>
            <span className="wizard-percent">{Math.round(progress)}%</span>
          </div>
        ) : null}
      </div>

      {isQuestionStep ? (
        <div className="wizard-stage">
          <article className="question-card question-card--single" key={questions[questionIndex]}>
            <h4 className="question-title question-title--large">{questions[questionIndex]}</h4>
            <div className="answer-list">
              {answerLabels.map((label, value) => (
                <button
                  className={
                    form.answers[questionIndex] === value
                      ? "choice-row choice-row--active"
                      : "choice-row"
                  }
                  key={label}
                  type="button"
                  disabled={loading}
                  onClick={() => onAnswerChange(questionIndex, value)}
                >
                  <span className="choice-radio" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {isContextStep && contextStep ? (
        <div className="wizard-stage">
          <article className="question-card question-card--single context-card">
            <p className="question-index">{contextStep.eyebrow}</p>
            <h4 className="question-title question-title--large">{contextStep.title}</h4>

            {contextStep.type === "choice" ? (
              <div className="answer-list">
                {contextStep.options.map((option) => (
                  <button
                    className={
                      form[contextStep.key] === option.value ? "choice-row choice-row--active" : "choice-row"
                    }
                    key={option.label}
                    type="button"
                    disabled={loading}
                    onClick={() => onFieldChange(contextStep.key, option.value)}
                  >
                    <span className="choice-radio" />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <div className="wizard-actions">
        <button className="btn btn--ghost wizard-btn-ghost" type="button" onClick={onPrevious} disabled={currentStep === 0 || loading}>
          Anterior
        </button>
        {currentStep < 18 ? (
          <button className="btn wizard-btn-primary" type="button" onClick={onNext} disabled={loading || !canProceed}>
            Siguiente
          </button>
        ) : (
          <button className="btn wizard-btn-primary" type="button" onClick={onSubmit} disabled={loading || !canProceed}>
            {loading ? "Guardando..." : "Enviar"}
          </button>
        )}
      </div>
    </PanelCard>
  );
}
