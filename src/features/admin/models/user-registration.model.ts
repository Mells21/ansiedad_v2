export type ManagedUserRole = "alumno" | "psicologo" | "admin";

export interface ManagedUserFormValues {
  role: ManagedUserRole;
  fullName: string;
  password: string;
  dni: string;
  grade: string;
  section: string;
}
