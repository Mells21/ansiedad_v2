export type UserRole = "admin" | "psicologo" | "alumno";

export interface User {
  id: string;
  firebaseUid?: string;
  names: string;
  email?: string;
  code?: string;
  role: UserRole;
  grade?: string;
  section?: string;
}
