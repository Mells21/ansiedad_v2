import type { ManagedUserDirectoryEntry } from "@/features/admin/models/managed-user-directory.model";
import type { ModelMetrics } from "@/features/admin/models/model-metrics.model";
import type { AppSession } from "@/features/auth/services/session.service";

export interface GroupedStudentsByGrade {
  grade: string;
  totalStudents: number;
  sections: Array<{
    section: string;
    students: ManagedUserDirectoryEntry[];
  }>;
}

export interface AdminOutletContextValue {
  admins: ManagedUserDirectoryEntry[];
  closeSession: () => Promise<void>;
  filteredStudents: ManagedUserDirectoryEntry[];
  groupedStudents: GroupedStudentsByGrade[];
  metrics: ModelMetrics | null;
  metricsError: string | null;
  metricsLoading: boolean;
  psychologists: ManagedUserDirectoryEntry[];
  reloadMetrics: () => Promise<void>;
  selectedGrade: string | null;
  selectedGradeData: GroupedStudentsByGrade | null;
  selectedSection: string | null;
  selectedSectionStudents: ManagedUserDirectoryEntry[];
  selectGrade: (grade: string) => void;
  selectSection: (section: string) => void;
  session: AppSession | null;
  setStudentSearchTerm: (value: string) => void;
  studentSearchTerm: string;
  students: ManagedUserDirectoryEntry[];
  totalUsers: number;
  usersError: string | null;
  usersLoading: boolean;
}
