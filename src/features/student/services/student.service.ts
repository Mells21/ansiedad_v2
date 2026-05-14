import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, setDoc } from "firebase/firestore/lite";
import { getCurrentSession } from "@/features/auth/services/auth.service";
import type {
  StudentAssessment,
  StudentCaseDetail,
  StudentDiagnosis,
  StudentHelpRequest,
  StudentHelpRequestFormValues,
  StudentHistoryItem,
  StudentIntakeFormValues,
  StudentProfile,
} from "@/features/student/models/student-case.model";
import { httpPost } from "@/shared/services/http.service";
import { firebaseDb, isFirebaseConfigured } from "@/shared/lib/firebase";
import {
  derivePreliminaryLabel,
  deriveRiskLevel,
  mapSleepHours,
  mapStudyHours,
  normalizeAnxietyScore,
  recommendationMap,
} from "@/shared/lib/student-assessment";

const HELP_RESPONSES_SEEN_KEY_PREFIX = "student_help_responses_seen";
const STUDENT_HELP_RESPONSES_EVENT = "student-help-responses-updated";

function getHelpResponsesSeenKey(studentId: string) {
  return `${HELP_RESPONSES_SEEN_KEY_PREFIX}_${studentId}`;
}

function getHelpResponseTimestamp(helpRequest: StudentHelpRequest) {
  const source = helpRequest.attendedAt ?? helpRequest.submittedAt;
  const parsed = new Date(source).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getLastSeenHelpResponseTimestamp(studentId: string) {
  const raw = localStorage.getItem(getHelpResponsesSeenKey(studentId));
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function dispatchHelpResponsesUpdated() {
  window.dispatchEvent(new CustomEvent(STUDENT_HELP_RESPONSES_EVENT));
}

function buildStudentProfileFromSession(form: StudentIntakeFormValues): StudentProfile {
  const session = getCurrentSession();
  const livesWithParents = Boolean(form.livesWithParents);

  return {
    id: session?.user.firebaseUid ?? session?.user.id ?? form.code,
    code: form.code,
    fullName: form.fullName,
    gradeSection: form.gradeSection,
    livesWithParents,
    parentsValue: livesWithParents ? 1 : 0,
    economicSituation: form.economicSituation,
    sleepHours: form.sleepHours,
    sleepValue: mapSleepHours(form.sleepHours),
    extracurricularFrequency: form.extracurricularFrequency,
    studyHours: form.studyHours,
    studyValue: mapStudyHours(form.studyHours),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildDetail(
  student: StudentProfile,
  assessments: StudentAssessment[],
  diagnoses: StudentDiagnosis[] = [],
  helpRequests: StudentHelpRequest[] = [],
): StudentCaseDetail {
  const latestAssessment = assessments[0] ?? null;
  const latestHelpRequest = helpRequests[0] ?? null;
  const diagnosisByAssessmentId = new Map<string, StudentDiagnosis>();

  diagnoses.forEach((diagnosis) => {
    diagnosisByAssessmentId.set(String(diagnosis.id), diagnosis);
  });

  const history: StudentHistoryItem[] = assessments.map((assessment) => {
    const diagnosis = diagnosisByAssessmentId.get(String(assessment.id));
    return {
      assessmentId: assessment.id,
      submittedAt: assessment.submittedAt,
      rawScore: assessment.rawScore,
      normalizedScore: assessment.normalizedScore,
      preliminaryLabel: assessment.preliminaryLabel,
      preliminaryRisk: assessment.preliminaryRisk,
      diagnosisId: diagnosis?.id ?? null,
      finalLabel: diagnosis?.predictedLabel ?? null,
      finalRisk: diagnosis?.riskLevel ?? null,
      diagnosedAt: diagnosis?.diagnosedAt ?? null,
      status: diagnosis ? "diagnosticado" : "pendiente",
    };
  });

  const latestDiagnosis =
    (latestAssessment ? diagnosisByAssessmentId.get(String(latestAssessment.id)) ?? null : null) ??
    diagnoses[0] ??
    null;
  const recommendations =
    latestDiagnosis?.recommendations.length
      ? [...latestDiagnosis.recommendations]
      : latestAssessment
        ? [...recommendationMap[latestAssessment.preliminaryRisk]]
        : [...recommendationMap.bajo];

  return {
    student,
    latestAssessment,
    latestDiagnosis,
    latestHelpRequest,
    history,
    helpRequests,
    recommendations,
    status: latestAssessment ? (latestDiagnosis ? "diagnosticado" : "pendiente_diagnostico") : "sin_respuestas",
  };
}

export async function getStudentCaseDetailFromSession(): Promise<StudentCaseDetail | null> {
  const session = getCurrentSession();

  if (!session?.user.firebaseUid || !isFirebaseConfigured || !firebaseDb) {
    return null;
  }

  const studentRef = doc(firebaseDb, "students", session.user.firebaseUid);
  const studentSnapshot = await getDoc(studentRef);

  if (!studentSnapshot.exists()) {
    return null;
  }

  const studentData = studentSnapshot.data();
  const student: StudentProfile = {
    id: studentSnapshot.id,
    code: (studentData.code as string | undefined) ?? session.user.code ?? "",
    fullName: (studentData.fullName as string | undefined) ?? session.user.names,
    gradeSection:
      (studentData.gradeSection as string | undefined) ??
      [session.user.grade, session.user.section].filter(Boolean).join(" "),
    livesWithParents: Boolean(studentData.livesWithParents),
    parentsValue: studentData.livesWithParents ? 1 : 0,
    economicSituation: Number(studentData.economicSituation ?? 1),
    sleepHours: Number(studentData.sleepHours ?? 7),
    sleepValue: mapSleepHours(Number(studentData.sleepHours ?? 7)),
    extracurricularFrequency: Number(studentData.extracurricularFrequency ?? 1),
    studyHours: Number(studentData.studyHours ?? 2),
    studyValue: mapStudyHours(Number(studentData.studyHours ?? 2)),
    createdAt: (studentData.createdAt as string | undefined) ?? new Date().toISOString(),
    updatedAt: (studentData.updatedAt as string | undefined) ?? new Date().toISOString(),
  };

  const assessmentsSnapshot = await getDocs(
    query(collection(firebaseDb, "students", session.user.firebaseUid, "assessments"), orderBy("submittedAt", "desc")),
  );

  const assessments: StudentAssessment[] = assessmentsSnapshot.docs.map((assessmentDoc) => {
    const data = assessmentDoc.data();
    return {
      id: assessmentDoc.id,
      answers: (data.answers as number[]) ?? [],
      rawScore: Number(data.rawScore ?? 0),
      normalizedScore: Number(data.normalizedScore ?? 0),
      preliminaryLabel: (data.preliminaryLabel as string | undefined) ?? "Normal",
      preliminaryRisk: (data.preliminaryRisk as "bajo" | "moderado" | "alto" | undefined) ?? "bajo",
      submittedAt: (data.submittedAt as string | undefined) ?? new Date().toISOString(),
    };
  });

  const diagnosesSnapshot = await getDocs(
    query(collection(firebaseDb, "students", session.user.firebaseUid, "diagnoses"), orderBy("diagnosedAt", "desc")),
  );

  const diagnoses: StudentDiagnosis[] = diagnosesSnapshot.docs.map((diagnosisDoc) => {
    const data = diagnosisDoc.data();
    return {
      id: (data.assessmentId as string | undefined) ?? diagnosisDoc.id,
      notas: Number(data.notas ?? 0),
      conducta: Number(data.conducta ?? 0),
      inasistencias: Number(data.inasistencias ?? 0),
      recommendations: Array.isArray(data.recommendations)
        ? data.recommendations.map((item) => String(item))
        : [],
      predictedClass: Number(data.predictedClass ?? 0),
      predictedLabel: (data.predictedLabel as string | undefined) ?? "Normal",
      riskLevel: (data.riskLevel as "bajo" | "moderado" | "alto" | undefined) ?? "bajo",
      probabilities: Array.isArray(data.probabilities)
        ? data.probabilities.map((item) => ({
            label: String((item as { label?: string }).label ?? ""),
            value: Number((item as { value?: number }).value ?? 0),
          }))
        : [],
      diagnosedAt: (data.diagnosedAt as string | undefined) ?? new Date().toISOString(),
    };
  });

  const helpRequestsSnapshot = await getDocs(
    query(collection(firebaseDb, "students", session.user.firebaseUid, "helpRequests"), orderBy("submittedAt", "desc")),
  );

  const helpRequests: StudentHelpRequest[] = helpRequestsSnapshot.docs.map((helpRequestDoc) => {
    const data = helpRequestDoc.data();
    return {
      id: helpRequestDoc.id,
      reason: (data.reason as string | undefined) ?? "Necesito hablar con alguien",
      urgency: (data.urgency as "bajo" | "medio" | "alto" | undefined) ?? "medio",
      message: (data.message as string | undefined) ?? "",
      status: (data.status as "pendiente" | "intervenido" | undefined) ?? "pendiente",
      submittedAt: (data.submittedAt as string | undefined) ?? new Date().toISOString(),
      attendedAt: (data.attendedAt as string | undefined) ?? null,
      psychologistRecommendation: (data.psychologistRecommendation as string | undefined) ?? null,
    };
  });

  return buildDetail(student, assessments, diagnoses, helpRequests);
}

export async function submitStudentIntake(form: StudentIntakeFormValues): Promise<StudentCaseDetail> {
  const session = getCurrentSession();

  if (session?.user.firebaseUid && isFirebaseConfigured && firebaseDb) {
    const rawScore = form.answers.reduce((total, answer) => total + answer, 0);
    const normalizedScore = normalizeAnxietyScore(rawScore);
    const preliminaryLabel = derivePreliminaryLabel(normalizedScore);
    const preliminaryRisk = deriveRiskLevel(preliminaryLabel);
    const now = new Date().toISOString();
    const studentRef = doc(firebaseDb, "students", session.user.firebaseUid);

    await setDoc(
      studentRef,
      {
        code: form.code,
        fullName: form.fullName,
        gradeSection: form.gradeSection,
        grade: session.user.grade ?? "",
        section: session.user.section ?? "",
        livesWithParents: form.livesWithParents,
        economicSituation: form.economicSituation,
        sleepHours: form.sleepHours,
        extracurricularFrequency: form.extracurricularFrequency,
        studyHours: form.studyHours,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true },
    );

    await addDoc(collection(firebaseDb, "students", session.user.firebaseUid, "assessments"), {
      answers: form.answers,
      rawScore,
      normalizedScore,
      preliminaryLabel,
      preliminaryRisk,
      livesWithParents: form.livesWithParents,
      economicSituation: form.economicSituation,
      sleepHours: form.sleepHours,
      extracurricularFrequency: form.extracurricularFrequency,
      studyHours: form.studyHours,
      submittedAt: now,
    });

    const detail = await getStudentCaseDetailFromSession();
    if (detail) {
      return detail;
    }
  }

  return httpPost<StudentIntakeFormValues, StudentCaseDetail>("/students/intake", form);
}

export async function createStudentHelpRequest(form: StudentHelpRequestFormValues): Promise<StudentCaseDetail> {
  const session = getCurrentSession();

  if (!session?.user.firebaseUid || !isFirebaseConfigured || !firebaseDb) {
    throw new Error("No se pudo enviar la solicitud de ayuda porque la base de datos no esta disponible.");
  }

  const now = new Date().toISOString();
  const studentRef = doc(firebaseDb, "students", session.user.firebaseUid);

  await setDoc(
    studentRef,
    {
      code: session.user.code ?? "",
      fullName: session.user.names ?? "Estudiante",
      gradeSection: [session.user.grade, session.user.section].filter(Boolean).join(" "),
      grade: session.user.grade ?? "",
      section: session.user.section ?? "",
      updatedAt: now,
      createdAt: now,
    },
    { merge: true },
  );

  await addDoc(collection(firebaseDb, "students", session.user.firebaseUid, "helpRequests"), {
    reason: form.reason,
    urgency: form.urgency,
    message: form.message.trim(),
    status: "pendiente",
    submittedAt: now,
  });

  const detail = await getStudentCaseDetailFromSession();
  if (!detail) {
    throw new Error("La solicitud se guardo, pero no se pudo refrescar la ficha del estudiante.");
  }

  return detail;
}

export function getStudentHelpResponsesEventName() {
  return STUDENT_HELP_RESPONSES_EVENT;
}

export function getUnreadHelpResponsesCount(detail: StudentCaseDetail | null, studentId?: string) {
  if (!detail || !studentId) {
    return 0;
  }

  const lastSeenTimestamp = getLastSeenHelpResponseTimestamp(studentId);
  return detail.helpRequests.filter((helpRequest) => {
    if (!helpRequest.psychologistRecommendation) {
      return false;
    }

    return getHelpResponseTimestamp(helpRequest) > lastSeenTimestamp;
  }).length;
}

export function markStudentHelpResponsesSeen(detail: StudentCaseDetail | null, studentId?: string) {
  if (!detail || !studentId) {
    return;
  }

  const latestResponseTimestamp = detail.helpRequests.reduce((maxTimestamp, helpRequest) => {
    if (!helpRequest.psychologistRecommendation) {
      return maxTimestamp;
    }

    return Math.max(maxTimestamp, getHelpResponseTimestamp(helpRequest));
  }, 0);

  localStorage.setItem(getHelpResponsesSeenKey(studentId), String(latestResponseTimestamp || Date.now()));
  dispatchHelpResponsesUpdated();
}

export async function getStudentHelpResponseNotificationCount(): Promise<number> {
  const session = getCurrentSession();
  if (!session?.user.firebaseUid) {
    return 0;
  }

  const detail = await getStudentCaseDetailFromSession();
  return getUnreadHelpResponsesCount(detail, session.user.firebaseUid);
}
