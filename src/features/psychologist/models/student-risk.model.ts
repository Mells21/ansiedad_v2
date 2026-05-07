export interface StudentRisk {
  id: string;
  studentName: string;
  gradeSection: string;
  riskLevel: "bajo" | "moderado" | "alto";
  latestScore: number;
  status: "pendiente" | "diagnosticado";
  latestLabel: string;
  submittedAt: string;
}
