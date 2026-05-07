import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentSession } from "@/features/auth/services/auth.service";
import type { StudentCaseDetail, StudentIntakeFormValues } from "@/features/student/models/student-case.model";
import { getStudentCaseDetailFromSession, submitStudentIntake } from "@/features/student/services/student.service";

const LAST_STEP = 18;
const currentSession = getCurrentSession();

const initialForm: StudentIntakeFormValues = {
  code: currentSession?.user.code ?? "711",
  fullName: currentSession?.user.names ?? "Maria Garcia",
  gradeSection: [currentSession?.user.grade, currentSession?.user.section].filter(Boolean).join(" ") || "5to A",
  livesWithParents: true,
  economicSituation: 1,
  sleepHours: 7,
  extracurricularFrequency: 1,
  studyHours: 2,
  answers: new Array(14).fill(0),
};

function addOneMonth(dateValue: string) {
  const date = new Date(dateValue);
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
}

export function useStudentDashboard() {
  const [form, setForm] = useState<StudentIntakeFormValues>(initialForm);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentCaseDetail | null>(null);
  const [submittedNow, setSubmittedNow] = useState(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    getStudentCaseDetailFromSession()
      .then((storedDetail) => {
        if (!storedDetail) {
          return;
        }

        setDetail(storedDetail);
        setSubmittedNow(false);
        setForm((current) => ({
          ...current,
          code: storedDetail.student.code,
          fullName: storedDetail.student.fullName,
          gradeSection: storedDetail.student.gradeSection,
          livesWithParents: storedDetail.student.livesWithParents,
          economicSituation: storedDetail.student.economicSituation,
          sleepHours: storedDetail.student.sleepHours,
          extracurricularFrequency: storedDetail.student.extracurricularFrequency,
          studyHours: storedDetail.student.studyHours,
        }));
      })
      .catch(() => {
        // Firebase can be configured later; the local flow still works in the meantime.
      });
  }, []);

  const latestSubmittedAt = detail?.latestAssessment?.submittedAt ?? null;
  const nextAvailableTestDate = useMemo(
    () => (latestSubmittedAt ? addOneMonth(latestSubmittedAt) : null),
    [latestSubmittedAt],
  );
  const isTestLocked = nextAvailableTestDate ? nextAvailableTestDate.getTime() > Date.now() : false;
  const nextAvailableTestLabel = nextAvailableTestDate
    ? nextAvailableTestDate.toLocaleDateString("es-PE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

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

  return {
    currentStep,
    detail,
    error,
    form,
    isTestLocked,
    loading,
    nextStep,
    nextAvailableTestLabel,
    previousStep,
    submittedNow,
    submit,
    updateAnswer,
    updateField,
  };
}
