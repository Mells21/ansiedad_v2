export type TestPeriodicity = "mensual" | "bimestral" | "trimestral" | "libre";

export interface TestScheduleConfig {
  id?: string;
  periodicity: TestPeriodicity;
  isActive: boolean;
  
  // Scoping
  targetGrades: string[];      // e.g. ["1", "2"]
  targetSections: string[];    // e.g. ["A", "B"]
  targetStudentIds: string[];  // For specific student overrides
  
  // Availability
  startDate: string;           // ISO
  endDate: string;             // ISO
  
  updatedAt: string;
}
