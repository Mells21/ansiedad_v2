import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentSession } from "@/features/auth/services/auth.service";
import type {
  StudentCaseDetail,
  StudentHelpRequestFormValues,
  StudentIntakeFormValues,
} from "@/features/student/models/student-case.model";
import { getStudentCaseDetailFromSession, createStudentHelpRequest, submitStudentIntake } from "@/features/student/services/student.service";
import { getTestScheduleConfig } from "@/features/student/services/test-config.service";
import type { TestScheduleConfig } from "@/features/student/models/test-config.model";

const LAST_STEP = 18;
const currentSession = getCurrentSession();

const initialForm: StudentIntakeFormValues = {
  code: currentSession?.user.code ?? "711",
  fullName: currentSession?.user.names ?? "Maria Garcia",
  gradeSection: [currentSession?.user.grade, currentSession?.user.section].filter(Boolean).join(" ") || "5to A",
  livesWithParents: null,
  economicSituation: -1,
  sleepHours: -1,
  extracurricularFrequency: -1,
  studyHours: -1,
  answers: new Array(14).fill(-1),
};

const initialHelpRequestForm: StudentHelpRequestFormValues = {
  reason: "Ansiedad / Nerviosismo",
  urgency: "medio",
  message: "",
};

function addMonths(dateValue: string, months: number) {
  const date = new Date(dateValue);
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

function getPeriodicityLabel(periodicity: TestScheduleConfig["periodicity"]) {
  if (periodicity === "mensual") return "1 mes";
  if (periodicity === "bimestral") return "2 meses";
  if (periodicity === "trimestral") return "3 meses";
  return "sin espera";
}

export function useStudentDashboard() {
  const [form, setForm] = useState<StudentIntakeFormValues>(initialForm);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentCaseDetail | null>(null);
  const [config, setConfig] = useState<TestScheduleConfig | null>(null);
  const [submittedNow, setSubmittedNow] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpRequestForm, setHelpRequestForm] = useState<StudentHelpRequestFormValues>(initialHelpRequestForm);
  const [helpRequestLoading, setHelpRequestLoading] = useState(false);
  const [helpRequestError, setHelpRequestError] = useState<string | null>(null);
  const [helpRequestSuccess, setHelpRequestSuccess] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    Promise.all([getStudentCaseDetailFromSession(), getTestScheduleConfig()])
      .then(([storedDetail, testConfig]) => {
        if (storedDetail) {
          setDetail(storedDetail);
          setForm((current) => ({
            ...current,
            code: storedDetail.student.code,
            fullName: storedDetail.student.fullName,
            gradeSection: storedDetail.student.gradeSection,
          }));
        }
        if (testConfig) {
          setConfig(testConfig);
        }
        setSubmittedNow(false);
      })
      .catch(() => {});
  }, []);

  const latestSubmittedAt = detail?.latestAssessment?.submittedAt ?? null;
  const lockStatus = useMemo(() => {
    if (!config) {
      return { isLocked: false, label: null, detail: "Disponible ahora" };
    }

    if (!config.isActive) {
      return {
        isLocked: true,
        label: null,
        detail: "El test esta cerrado globalmente por el psicologo.",
      };
    }

    const now = new Date();
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);

    if (now < start) {
      return {
        isLocked: true,
        label: start.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }),
        detail: `El test se abrira el ${start.toLocaleDateString("es-PE")}.`,
      };
    }

    if (now > end) {
      return {
        isLocked: true,
        label: null,
        detail: "El periodo de test ha finalizado.",
      };
    }

    const session = getCurrentSession();
    if (session?.user.role === "alumno") {
      const studentGrade = session.user.grade ?? "";
      const studentSection = session.user.section ?? "";
      const studentId = session.user.firebaseUid ?? "";

      const gradeTargeted = config.targetGrades.length === 0 || config.targetGrades.includes(studentGrade);
      const sectionTargeted = config.targetSections.length === 0 || config.targetSections.includes(studentSection);
      const studentExplicitlyTargeted = config.targetStudentIds.includes(studentId);

      if (!studentExplicitlyTargeted && (!gradeTargeted || !sectionTargeted)) {
        return {
          isLocked: true,
          label: null,
          detail: "Tu grado o seccion no esta habilitado para este test.",
        };
      }
    }

    if (latestSubmittedAt && config.periodicity !== "libre") {
      const monthsToAdd = config.periodicity === "mensual" ? 1 : config.periodicity === "bimestral" ? 2 : 3;
      const nextDate = addMonths(latestSubmittedAt, monthsToAdd);
      if (nextDate.getTime() > Date.now()) {
        return {
          isLocked: true,
          label: nextDate.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }),
          detail: `Ya completaste este periodo. Segun la configuracion actual, debes esperar ${getPeriodicityLabel(config.periodicity)} antes de volver a responder.`,
        };
      }
    }

    if (config.periodicity === "libre") {
      return {
        isLocked: false,
        label: null,
        detail: "Disponible ahora sin tiempo de espera.",
      };
    }

    return {
      isLocked: false,
      label: null,
      detail: `Disponible ahora. La configuracion actual permite 1 test cada ${getPeriodicityLabel(config.periodicity)}.`,
    };
  }, [config, latestSubmittedAt]);

  const isTestLocked = lockStatus.isLocked;
  const nextAvailableTestLabel = lockStatus.label;
  const testAvailabilityDetail = lockStatus.detail;

  const updateField = <TKey extends keyof StudentIntakeFormValues>(
    field: TKey,
    value: StudentIntakeFormValues[TKey],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateAnswer = (index: number, value: number) => {
    setForm((current) => ({
      ...current,
      answers: current.answers.map((answer, answerIndex) => (answerIndex === index ? value : answer)),
    }));
  };

  const nextStep = () => {
    setCurrentStep((step) => Math.min(LAST_STEP, step + 1));
  };

  const previousStep = () => {
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const submit = async () => {
    if (submitLockRef.current || isTestLocked) {
      return false;
    }

    submitLockRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const savedDetail = await submitStudentIntake(form);
      setDetail(savedDetail);
      setSubmittedNow(true);
      setCurrentStep(LAST_STEP);
      return true;
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No se pudo guardar tu ficha.");
      return false;
    } finally {
      submitLockRef.current = false;
      setLoading(false);
    }
  };

  const openHelpModal = () => {
    setHelpRequestError(null);
    setHelpRequestSuccess(null);
    setHelpModalOpen(true);
  };

  const closeHelpModal = () => {
    if (helpRequestLoading) {
      return;
    }

    setHelpModalOpen(false);
    setHelpRequestError(null);
  };

  const updateHelpRequestField = <TKey extends keyof StudentHelpRequestFormValues>(
    field: TKey,
    value: StudentHelpRequestFormValues[TKey],
  ) => {
    setHelpRequestForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitHelpRequest = async () => {
    setHelpRequestLoading(true);
    setHelpRequestError(null);
    setHelpRequestSuccess(null);

    try {
      const savedDetail = await createStudentHelpRequest(helpRequestForm);
      setDetail(savedDetail);
      setHelpModalOpen(false);
      setHelpRequestForm(initialHelpRequestForm);
      setHelpRequestSuccess("Tu solicitud fue enviada al psicologo del colegio.");
      return true;
    } catch (submissionError) {
      setHelpRequestError(
        submissionError instanceof Error ? submissionError.message : "No se pudo enviar la solicitud de ayuda.",
      );
      return false;
    } finally {
      setHelpRequestLoading(false);
    }
  };

  return {
    currentStep,
    detail,
    error,
    form,
    helpModalOpen,
    helpRequestError,
    helpRequestForm,
    helpRequestLoading,
    helpRequestSuccess,
    isTestLocked,
    loading,
    nextStep,
    nextAvailableTestLabel,
    testAvailabilityDetail,
    previousStep,
    closeHelpModal,
    openHelpModal,
    submittedNow,
    submit,
    submitHelpRequest,
    updateAnswer,
    updateField,
    updateHelpRequestField,
  };
}
