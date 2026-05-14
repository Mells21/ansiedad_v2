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
  const roleLabel = getRoleLabel(form.role);
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
        throw new Error("Completa nombre, DNI, contraseña y sexo.");
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
        className="admin-register-card"
        title="Registro de usuarios"
        subtitle="Crea accesos nuevos con una captura mas ordenada, clara y adaptable a cualquier pantalla."
      >
        <div className="admin-register-panel">
          <div className="admin-register-tabs" role="tablist" aria-label="Tipo de usuario">
            <button
              className={form.role === "alumno" ? "admin-register-tab admin-register-tab--active" : "admin-register-tab"}
              type="button"
              onClick={() => handleRoleChange("alumno")}
            >
              <span className="admin-register-tab__title">Registrar alumno</span>
              <span className="admin-register-tab__meta">Incluye grado y seccion</span>
            </button>
            <button
              className={form.role === "psicologo" ? "admin-register-tab admin-register-tab--active" : "admin-register-tab"}
              type="button"
              onClick={() => handleRoleChange("psicologo")}
            >
              <span className="admin-register-tab__title">Registrar psicologo</span>
              <span className="admin-register-tab__meta">Acceso de seguimiento clinico</span>
            </button>
            <button
              className={form.role === "admin" ? "admin-register-tab admin-register-tab--active" : "admin-register-tab"}
              type="button"
              onClick={() => handleRoleChange("admin")}
            >
              <span className="admin-register-tab__title">Registrar admin</span>
              <span className="admin-register-tab__meta">Permisos de gestion institucional</span>
            </button>
          </div>

          <section className="admin-register-section">
            <div className="admin-register-section__header">
              <div>
                <p className="admin-register-section__eyebrow">Datos personales</p>
                <h4 className="admin-register-section__title">Informacion basica del usuario</h4>
              </div>
              <span className="admin-register-section__chip">{roleLabel}</span>
            </div>

            <div className="admin-register-grid">
              <label className="admin-register-field">
                <span>Nombre completo</span>
                <input value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
              </label>

              <label className="admin-register-field">
                <span>DNI</span>
                <input
                  value={form.dni}
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="00000000"
                  onChange={(event) => updateField("dni", event.target.value)}
                />
              </label>

              <label className="admin-register-field">
                <span>Sexo</span>
                <select value={form.gender} onChange={(event) => updateField("gender", event.target.value as any)}>
                  <option value="">Seleccionar sexo...</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                </select>
              </label>
            </div>
          </section>

          <section className="admin-register-section">
            <div className="admin-register-section__header">
              <div>
                <p className="admin-register-section__eyebrow">Datos academicos</p>
                <h4 className="admin-register-section__title">Contexto institucional</h4>
              </div>
            </div>

            {form.role === "alumno" ? (
              <div className="admin-register-grid admin-register-grid--academic">
                <label className="admin-register-field">
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

                <label className="admin-register-field">
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
              </div>
            ) : (
              <div className="admin-register-empty-state">
                Este rol no requiere grado ni seccion para completar el alta.
              </div>
            )}
          </section>

          <section className="admin-register-section">
            <div className="admin-register-section__header">
              <div>
                <p className="admin-register-section__eyebrow">Credenciales</p>
                <h4 className="admin-register-section__title">Acceso inicial al sistema</h4>
              </div>
            </div>

            <div className="admin-register-grid admin-register-grid--credentials">
              <label className="admin-register-field">
                <span>Contraseña</span>
                <input
                  type="password"
                  placeholder="Define una contraseña segura"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                />
              </label>
            </div>
          </section>

          <div className="admin-register-actions">
            <div className="admin-register-actions__copy">
              <strong>{roleLabel}</strong>
              <span>Se creara el acceso y el perfil institucional en un solo paso.</span>
            </div>

            <button className="btn admin-register-submit" type="button" onClick={submit} disabled={isSubmitDisabled}>
              {loading ? "Registrando..." : "Crear usuario"}
            </button>
          </div>

          {error ? <p className="form-error admin-register-error">{error}</p> : null}
        </div>
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
