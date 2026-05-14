export interface PsychologistAlert {
  id: string;
  studentName: string;
  gradeSection: string;
  riskLevel: "bajo" | "moderado" | "alto";
  latestScore: number;
  status: "pendiente" | "diagnosticado";
  latestLabel: string;
  submittedAt: string;
}

export interface PsychologistHelpAlert {
  id: string;
  studentId: string;
  studentName: string;
  gradeSection: string;
  reason: string;
  urgency: "bajo" | "medio" | "alto";
  message: string;
  status: "pendiente" | "intervenido";
  submittedAt: string;
  attendedAt: string | null;
  psychologistRecommendation: string | null;
}

export interface PsychologistSectionSnapshot {
  label: string;
  students: number;
  risk: "bajo" | "moderado" | "alto";
  note: string;
}

export interface PsychologistStats {
  highAlerts: number;
  moderateAlerts: number;
  testsThisMonth: number;
  pendingDiagnosis: number;
}

export interface PsychologistDashboardData {
  stats: PsychologistStats;
  alerts: PsychologistAlert[];
  helpAlerts: PsychologistHelpAlert[];
  sections: PsychologistSectionSnapshot[];
  dailyRecommendations: string[];
}

export interface PsychologistDiagnosisForm {
  notas: number;
  conducta: number;
  inasistencias: number;
  recommendations: string;
}
