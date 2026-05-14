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
  gender: "",
  grade: "",
  section: "",
};

interface CreatedUserSummary {
  dni: string;
  fullName: string;
  grade: string;
  role: ManagedUserRole;
  section: string;
}

function getRoleLabel(role: ManagedUserRole) {
  if (role === "alumno") {
    return "Alumno";
  }

  if (role === "psicologo") {
    return "Psicologo";
  }

  return "Administrador";
}

export function UserRegistrationPanel() {
  const [form, setForm] = useState<ManagedUserFormValues>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<CreatedUserSummary | null>(null);
  const isSubmitDisabled =
    !form.fullName.trim() ||
    !form.password.trim() ||
    !/^\d{8}$/.test(form.dni.trim()) ||
    !form.gender ||
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
    setCreatedUser(null);

    try {
      if (!/^\d{8}$/.test(form.dni.trim())) {
        throw new Error("El DNI debe tener 8 digitos.");
      }

      if (!form.fullName.trim() || !form.password.trim() || !form.dni.trim() || !form.gender) {
        throw new Error("Completa nombre, DNI, contrasena y sexo.");
      }

      if (form.role === "alumno" && (!form.grade.trim() || !form.section.trim())) {
        throw new Error("Para registrar un alumno debes indicar grado y seccion.");
      }

      const submittedForm = {
        dni: form.dni.trim(),
        fullName: form.fullName.trim(),
        grade: form.grade.trim(),
        role: form.role,
        section: form.section.trim(),
      };

      await registerManagedUser(form);
      setCreatedUser(submittedForm);
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
    <>
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
          <label className="field">
            <span>Sexo</span>
            <select value={form.gender} onChange={(event) => updateField("gender", event.target.value as any)}>
              <option value="">Seleccionar sexo...</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
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
      </PanelCard>

      {createdUser ? (
        <div className="psychologist-modal-backdrop" role="presentation" onClick={() => setCreatedUser(null)}>
          <div
            aria-modal="true"
            className="psychologist-modal admin-confirmation-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="psychologist-modal-head admin-confirmation-head">
              <div>
                <p className="admin-kicker">Registro completado</p>
                <h2 className="admin-title psychologist-modal-title">Usuario creado correctamente</h2>
              </div>
              <button className="btn btn--ghost" type="button" onClick={() => setCreatedUser(null)}>
                Cerrar
              </button>
            </div>

            <div className="psychologist-modal-body">
              <div className="admin-confirmation-hero">
                <span className="admin-confirmation-badge">Confirmado</span>
                <strong>{createdUser.fullName}</strong>
                <p>
                  El usuario con rol de {getRoleLabel(createdUser.role).toLowerCase()} ya fue registrado y quedo
                  vinculado al DNI {createdUser.dni}.
                </p>
              </div>

              <div className="admin-confirmation-grid">
                <div className="soft-panel">
                  <p className="summary-label">Rol</p>
                  <strong className="summary-value">{getRoleLabel(createdUser.role)}</strong>
                </div>
                <div className="soft-panel">
                  <p className="summary-label">DNI</p>
                  <strong className="summary-value">{createdUser.dni}</strong>
                </div>
                {createdUser.role === "alumno" ? (
                  <div className="soft-panel">
                    <p className="summary-label">Seccion</p>
                    <strong className="summary-value">
                      {createdUser.grade} {createdUser.section}
                    </strong>
                  </div>
                ) : null}
              </div>

              <div className="cta-row admin-confirmation-actions">
                <button className="btn" type="button" onClick={() => setCreatedUser(null)}>
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
