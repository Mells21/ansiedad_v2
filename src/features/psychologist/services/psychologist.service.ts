import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore/lite";
import type { StudentCaseDetail, StudentDiagnosis, StudentProfile } from "@/features/student/models/student-case.model";
import type {
  PsychologistAlert,
  PsychologistDashboardData,
  PsychologistDiagnosisForm,
  PsychologistSectionSnapshot,
} from "@/features/psychologist/models/psychologist-dashboard.model";
import { firebaseDb, isFirebaseConfigured } from "@/shared/lib/firebase";
import {
  derivePreliminaryLabel,
  mapSleepHours,
  mapStudyHours,
  recommendationMap,
} from "@/shared/lib/student-assessment";
import { predictAnxietyWithRandomForest } from "@/shared/lib/random-forest";

function ensureFirebaseReady() {
  if (!isFirebaseConfigured || !firebaseDb) {
    throw new Error("Firebase no esta configurado para el modulo de psicologia.");
  }
}

function getRiskFromLabel(label: string): "bajo" | "moderado" | "alto" {
  if (label === "Moderada") {
    return "moderado";
  }
  if (label === "Severa" || label === "Extrema") {
    return "alto";
  }
  return "bajo";
}

function parseDiagnosis(data: Record<string, unknown>, fallbackId: string): StudentDiagnosis {
  return {
    id: (data.assessmentId as string | undefined) ?? fallbackId,
    notas: Number(data.notas ?? 0),
    conducta: Number(data.conducta ?? 0),
    inasistencias: Number(data.inasistencias ?? 0),
    recommendations: Array.isArray(data.recommendations) ? data.recommendations.map((item) => String(item)) : [],
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
}

function parseStudentProfile(studentId: string, data: Record<string, unknown>): StudentProfile {
  const sleepHours = Number(data.sleepHours ?? 7);
  const studyHours = Number(data.studyHours ?? 2);
  const livesWithParents = Boolean(data.livesWithParents);

  return {
    id: studentId,
    code: (data.code as string | undefined) ?? "",
    fullName: (data.fullName as string | undefined) ?? "Estudiante",
    gradeSection:
      (data.gradeSection as string | undefined) ?? [data.grade, data.section].filter(Boolean).join(" "),
    livesWithParents,
    parentsValue: livesWithParents ? 1 : 0,
    economicSituation: Number(data.economicSituation ?? 1),
    sleepHours,
    sleepValue: mapSleepHours(sleepHours),
    extracurricularFrequency: Number(data.extracurricularFrequency ?? 1),
    studyHours,
    studyValue: mapStudyHours(studyHours),
    createdAt: (data.createdAt as string | undefined) ?? new Date().toISOString(),
    updatedAt: (data.updatedAt as string | undefined) ?? new Date().toISOString(),
  };
}

function parseAssessment(assessmentId: string, data: Record<string, unknown>) {
  return {
    id: assessmentId,
    answers: Array.isArray(data.answers) ? data.answers.map((answer) => Number(answer)) : [],
    rawScore: Number(data.rawScore ?? 0),
    normalizedScore: Number(data.normalizedScore ?? 0),
    preliminaryLabel: (data.preliminaryLabel as string | undefined) ?? "Normal",
    preliminaryRisk: (data.preliminaryRisk as "bajo" | "moderado" | "alto" | undefined) ?? "bajo",
    submittedAt: (data.submittedAt as string | undefined) ?? new Date().toISOString(),
  };
}

async function getStudentDiagnoses(studentId: string) {
  ensureFirebaseReady();
  const snapshot = await getDocs(
    query(collection(firebaseDb!, "students", studentId, "diagnoses"), orderBy("diagnosedAt", "desc")),
  );

  return snapshot.docs.map((diagnosisDoc) => parseDiagnosis(diagnosisDoc.data(), diagnosisDoc.id));
}

async function buildStudentCaseDetail(studentId: string): Promise<StudentCaseDetail> {
  ensureFirebaseReady();

  const studentSnapshot = await getDoc(doc(firebaseDb!, "students", studentId));
  if (!studentSnapshot.exists()) {
    throw new Error("No se encontro el estudiante seleccionado.");
  }

  const student = parseStudentProfile(studentSnapshot.id, studentSnapshot.data());
  const assessmentsSnapshot = await getDocs(
    query(collection(firebaseDb!, "students", studentId, "assessments"), orderBy("submittedAt", "desc")),
  );
  const assessments = assessmentsSnapshot.docs.map((assessmentDoc) => parseAssessment(assessmentDoc.id, assessmentDoc.data()));
  const diagnoses = await getStudentDiagnoses(studentId);
  const diagnosisByAssessmentId = new Map<string, StudentDiagnosis>();

  diagnoses.forEach((diagnosis) => {
    diagnosisByAssessmentId.set(String(diagnosis.id), diagnosis);
  });

  const latestAssessment = assessments[0] ?? null;
  const latestDiagnosis =
    (latestAssessment ? diagnosisByAssessmentId.get(String(latestAssessment.id)) ?? null : null) ??
    diagnoses[0] ??
    null;
  const history = assessments.map((assessment) => {
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
    } as StudentCaseDetail["history"][number];
  });

  return {
    student,
    latestAssessment,
    latestDiagnosis,
    history,
    recommendations:
      latestDiagnosis?.recommendations.length
        ? [...latestDiagnosis.recommendations]
        : latestAssessment
          ? [...recommendationMap[latestAssessment.preliminaryRisk]]
          : [...recommendationMap.bajo],
    status: latestAssessment ? (latestDiagnosis ? "diagnosticado" : "pendiente_diagnostico") : "sin_respuestas",
  };
}

async function buildPsychologistAlert(studentId: string): Promise<PsychologistAlert | null> {
  ensureFirebaseReady();

  const studentSnapshot = await getDoc(doc(firebaseDb!, "students", studentId));
  if (!studentSnapshot.exists()) {
    return null;
  }

  const assessmentSnapshot = await getDocs(
    query(collection(firebaseDb!, "students", studentId, "assessments"), orderBy("submittedAt", "desc"), limit(1)),
  );
  const latestAssessmentDoc = assessmentSnapshot.docs[0];
  if (!latestAssessmentDoc) {
    return null;
  }

  const studentData = studentSnapshot.data();
  const assessment = parseAssessment(latestAssessmentDoc.id, latestAssessmentDoc.data());
  const diagnosisSnapshot = await getDoc(doc(firebaseDb!, "students", studentId, "diagnoses", latestAssessmentDoc.id));
  const diagnosis = diagnosisSnapshot.exists() ? parseDiagnosis(diagnosisSnapshot.data(), diagnosisSnapshot.id) : null;
  const latestLabel = diagnosis?.predictedLabel ?? assessment.preliminaryLabel;
  const riskLevel = diagnosis?.riskLevel ?? assessment.preliminaryRisk;

  return {
    id: studentId,
    studentName: (studentData.fullName as string | undefined) ?? "Estudiante",
    gradeSection:
      (studentData.gradeSection as string | undefined) ??
      [studentData.grade, studentData.section].filter(Boolean).join(" "),
    riskLevel,
    latestScore: assessment.normalizedScore,
    status: diagnosis ? "diagnosticado" : "pendiente",
    latestLabel,
    submittedAt: assessment.submittedAt,
  };
}

export async function getPsychologistDashboard(): Promise<PsychologistDashboardData> {
  ensureFirebaseReady();

  const studentsSnapshot = await getDocs(collection(firebaseDb!, "students"));
  const alertResults = await Promise.all(studentsSnapshot.docs.map((studentDoc) => buildPsychologistAlert(studentDoc.id)));
  const alerts = alertResults.filter((item): item is PsychologistAlert => item !== null);
  const sectionMap = new Map<string, Array<"bajo" | "moderado" | "alto">>();

  alerts.forEach((alert) => {
    const current = sectionMap.get(alert.gradeSection) ?? [];
    current.push(alert.riskLevel);
    sectionMap.set(alert.gradeSection, current);
  });

  const sections: PsychologistSectionSnapshot[] = Array.from(sectionMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, risks]) => {
      const risk = risks.includes("alto") ? "alto" : risks.includes("moderado") ? "moderado" : "bajo";
      return {
        label,
        students: risks.length,
        risk,
        note: risk === "bajo" ? "Monitoreo estable." : "Seguimiento focalizado desde psicologia escolar.",
      };
    });

  return {
    stats: {
      highAlerts: alerts.filter((item) => item.riskLevel === "alto").length,
      moderateAlerts: alerts.filter((item) => item.riskLevel === "moderado").length,
      testsThisMonth: alerts.length,
      pendingDiagnosis: alerts.filter((item) => item.status === "pendiente").length,
    },
    alerts: alerts.sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()),
    sections,
    dailyRecommendations: [
      "Revisar primero los tests recientes con riesgo alto o moderado.",
      "Comparar el resultado del test con notas, conducta e inasistencias antes de confirmar el diagnostico.",
      "Usar las recomendaciones personalizadas para dejar seguimiento claro al estudiante.",
    ],
  };
}

export async function getStudentDetail(studentId: string): Promise<StudentCaseDetail> {
  return buildStudentCaseDetail(studentId);
}

export async function diagnoseStudent(
  studentId: string,
  form: PsychologistDiagnosisForm,
): Promise<StudentCaseDetail> {
  ensureFirebaseReady();

  const detail = await buildStudentCaseDetail(studentId);
  if (!detail.latestAssessment) {
    throw new Error("El estudiante todavia no tiene un test registrado.");
  }

  const prediction = predictAnxietyWithRandomForest({
    ansiedad_score: detail.latestAssessment.normalizedScore,
    notas: form.notas,
    conducta: form.conducta,
    padres: detail.student.parentsValue,
    inasistencias: form.inasistencias,
    economia: detail.student.economicSituation,
    sueno: detail.student.sleepValue,
    extra: detail.student.extracurricularFrequency,
    estudio: detail.student.studyValue,
  });

  const diagnosisRef = doc(firebaseDb!, "students", studentId, "diagnoses", String(detail.latestAssessment.id));
  const diagnosedAt = new Date().toISOString();

  await setDoc(
    diagnosisRef,
    {
      assessmentId: String(detail.latestAssessment.id),
      notas: form.notas,
      conducta: form.conducta,
      inasistencias: form.inasistencias,
      recommendations: detail.latestDiagnosis?.recommendations ?? [],
      predictedClass: prediction.predictedClass,
      predictedLabel: prediction.predictedLabel,
      riskLevel: prediction.riskLevel,
      probabilities: prediction.probabilities,
      diagnosedAt,
      preliminaryRisk: getRiskFromLabel(prediction.predictedLabel),
    },
    { merge: true },
  );

  return buildStudentCaseDetail(studentId);
}

export async function saveDiagnosisRecommendations(
  studentId: string,
  recommendationsText: string,
): Promise<StudentCaseDetail> {
  ensureFirebaseReady();

  const detail = await buildStudentCaseDetail(studentId);
  if (!detail.latestAssessment || !detail.latestDiagnosis) {
    throw new Error("Primero debes emitir el diagnostico antes de guardar recomendaciones.");
  }

  const recommendations = recommendationsText
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  await setDoc(
    doc(firebaseDb!, "students", studentId, "diagnoses", String(detail.latestAssessment.id)),
    {
      recommendations,
    },
    { merge: true },
  );

  return buildStudentCaseDetail(studentId);
}
