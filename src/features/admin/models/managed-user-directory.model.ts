import type { UserRole } from "@/shared/models/user.model";

export interface ManagedUserDirectoryEntry {
  id: string;
  fullName: string;
  email: string;
  code: string;
  gender?: "masculino" | "femenino" | "otro";
  role: UserRole;
  grade?: string;
  section?: string;
  gradeSection?: string;
  createdAt?: string;
}
