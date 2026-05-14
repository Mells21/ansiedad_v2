export type ManagedUserRole = "alumno" | "psicologo" | "admin";

export interface ManagedUserFormValues {
  role: ManagedUserRole;
  fullName: string;
  password: string;
  dni: string;
  gender: "masculino" | "femenino" | "otro" | "";
  grade: string;
  section: string;
}
