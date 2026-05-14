export interface StudentIntakeFormValues {
  code: string;
  fullName: string;
  gradeSection: string;
  livesWithParents: boolean | null;
  economicSituation: number;
  sleepHours: number;
  extracurricularFrequency: number;
  studyHours: number;
  answers: number[];
}

export type StudentHelpRequestUrgency = "bajo" | "medio" | "alto";

export const studentHelpRequestReasons = [
  "Ansiedad / Nerviosismo",
  "Problemas familiares",
  "Problemas con companeros",
  "Problemas academicos",
  "Necesito hablar con alguien",
  "Otro",
] as const;

export interface StudentHelpRequestFormValues {
  reason: string;
  urgency: StudentHelpRequestUrgency;
  message: string;
}

export interface StudentProfile {
  id: string | number;
  code: string;
  fullName: string;
  gender?: string;
  gradeSection: string;
  livesWithParents: boolean;
  parentsValue: number;
  economicSituation: number;
  sleepHours: number;
  sleepValue: number;
  extracurricularFrequency: number;
  studyHours: number;
  studyValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAssessment {
  id: string | number;
  answers: number[];
  rawScore: number;
  normalizedScore: number;
  preliminaryLabel: string;
  preliminaryRisk: "bajo" | "moderado" | "alto";
  submittedAt: string;
}

export interface StudentDiagnosisProbability {
  label: string;
  value: number;
}

export interface StudentDiagnosis {
  id: string | number;
  notas: number;
  conducta: number;
  inasistencias: number;
  recommendations: string[];
  predictedClass: number;
  predictedLabel: string;
  riskLevel: "bajo" | "moderado" | "alto";
  probabilities: StudentDiagnosisProbability[];
  diagnosedAt: string;
}

export interface StudentHelpRequest {
  id: string | number;
  reason: string;
  urgency: StudentHelpRequestUrgency;
  message: string;
  status: "pendiente" | "intervenido";
  submittedAt: string;
  attendedAt?: string | null;
  psychologistRecommendation?: string | null;
}

export interface StudentHistoryItem {
  assessmentId: string | number;
  submittedAt: string;
  rawScore: number;
  normalizedScore: number;
  preliminaryLabel: string;
  preliminaryRisk: "bajo" | "moderado" | "alto";
  diagnosisId: string | number | null;
  finalLabel: string | null;
  finalRisk: "bajo" | "moderado" | "alto" | null;
  diagnosedAt: string | null;
  status: "diagnosticado" | "pendiente";
}

export interface StudentCaseDetail {
  student: StudentProfile;
  latestAssessment: StudentAssessment | null;
  latestDiagnosis: StudentDiagnosis | null;
  latestHelpRequest: StudentHelpRequest | null;
  history: StudentHistoryItem[];
  helpRequests: StudentHelpRequest[];
  recommendations: string[];
  status: "sin_respuestas" | "pendiente_diagnostico" | "diagnosticado";
}
