import { useState } from "react";
import type { ManagedUserFormValues, ManagedUserRole } from "@/features/admin/models/user-registration.model";
import { registerManagedUser } from "@/features/admin/services/user-registration.service";
import { PanelCard } from "@/shared/components/PanelCard";

const gradeOptions = ["1", "2", "3", "4", "5"] as const;
const sectionOptions = ["A", "B", "C", "D"] as const;

const initialForm: ManagedUserFormValues = {
  role: "alumno",
  fullName: "",
  password: "",
  dni: "",
  grade: "",
  section: "",
};

export function UserRegistrationPanel() {
  const [form, setForm] = useState<ManagedUserFormValues>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isSubmitDisabled =
    !form.fullName.trim() ||
    !form.password.trim() ||
    !/^\d{8}$/.test(form.dni.trim()) ||
    (form.role === "alumno" && (!form.grade.trim() || !form.section.trim())) ||
    loading;

  const updateField = <TKey extends keyof ManagedUserFormValues>(
    field: TKey,
    value: ManagedUserFormValues[TKey],
  ) => {
    setForm((current) => ({
      ...current,
      [field]:
        field === "dni"
          ? (String(value).replace(/\D/g, "").slice(0, 8) as ManagedUserFormValues[TKey])
          : value,
    }));
  };

  const handleRoleChange = (role: ManagedUserRole) => {
    setForm((current) => ({
      ...current,
      role,
      grade: role === "alumno" ? current.grade : "",
      section: role === "alumno" ? current.section : "",
    }));
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!/^\d{8}$/.test(form.dni.trim())) {
        throw new Error("El DNI debe tener 8 digitos.");
      }

      if (!form.fullName.trim() || !form.password.trim() || !form.dni.trim()) {
        throw new Error("Completa nombre, DNI y contrasena.");
      }

      if (form.role === "alumno" && (!form.grade.trim() || !form.section.trim())) {
        throw new Error("Para registrar un alumno debes indicar grado y seccion.");
      }

      const result = await registerManagedUser(form);
      setSuccess(`Usuario ${result.role} creado: ${result.email}`);
      setForm((current) => ({
        ...initialForm,
        role: current.role,
      }));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No se pudo registrar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PanelCard
      title="Registro de usuarios"
      subtitle="Crea cuentas de alumnos, psicologos y administradores directamente en Firebase Auth y guarda su perfil en Firestore."
      action={<span className="pill">Demo Firebase</span>}
    >
      <div className="student-tabs">
        <button
          className={form.role === "alumno" ? "student-tab student-tab--active" : "student-tab"}
          type="button"
          onClick={() => handleRoleChange("alumno")}
        >
          Registrar alumno
        </button>
        <button
          className={form.role === "psicologo" ? "student-tab student-tab--active" : "student-tab"}
          type="button"
          onClick={() => handleRoleChange("psicologo")}
        >
          Registrar psicologo
        </button>
        <button
          className={form.role === "admin" ? "student-tab student-tab--active" : "student-tab"}
          type="button"
          onClick={() => handleRoleChange("admin")}
        >
          Registrar admin
        </button>
      </div>

      <div className="assessment-grid">
        <label className="field">
          <span>Nombre completo</span>
          <input value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
        </label>
        <label className="field">
          <span>Contrasena</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
          />
        </label>
        <label className="field">
          <span>DNI</span>
          <input value={form.dni} onChange={(event) => updateField("dni", event.target.value)} />
        </label>
        {form.role === "alumno" ? (
          <>
            <label className="field">
              <span>Grado</span>
              <select value={form.grade} onChange={(event) => updateField("grade", event.target.value)}>
                <option value="">Seleccionar grado...</option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Seccion</span>
              <select value={form.section} onChange={(event) => updateField("section", event.target.value)}>
                <option value="">Seleccionar seccion...</option>
                {sectionOptions.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
      </div>

      <div className="cta-row">
        <button className="btn" type="button" onClick={submit} disabled={isSubmitDisabled}>
          {loading ? "Registrando..." : "Crear usuario"}
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}
    </PanelCard>
  );
}
