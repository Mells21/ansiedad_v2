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
  sections: PsychologistSectionSnapshot[];
  dailyRecommendations: string[];
}

export interface PsychologistDiagnosisForm {
  notas: number;
  conducta: number;
  inasistencias: number;
  recommendations: string;
}
