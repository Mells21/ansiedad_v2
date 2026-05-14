import type {
  StudentHelpRequestFormValues,
  StudentHelpRequestUrgency,
} from "@/features/student/models/student-case.model";
import { studentHelpRequestReasons } from "@/features/student/models/student-case.model";

interface StudentHelpRequestModalProps {
  error: string | null;
  form: StudentHelpRequestFormValues;
  loading: boolean;
  onClose: () => void;
  onFieldChange: <TKey extends keyof StudentHelpRequestFormValues>(
    field: TKey,
    value: StudentHelpRequestFormValues[TKey],
  ) => void;
  onSubmit: () => void;
}

const urgencyOptions: Array<{
  value: StudentHelpRequestUrgency;
  label: string;
  dotClassName: string;
}> = [
  { value: "bajo", label: "Bajo", dotClassName: "student-help-urgency-dot student-help-urgency-dot--low" },
  { value: "medio", label: "Medio", dotClassName: "student-help-urgency-dot student-help-urgency-dot--medium" },
  { value: "alto", label: "Alto", dotClassName: "student-help-urgency-dot student-help-urgency-dot--high" },
];

export function StudentHelpRequestModal({
  error,
  form,
  loading,
  onClose,
  onFieldChange,
  onSubmit,
}: StudentHelpRequestModalProps) {
  return (
    <div className="student-help-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        aria-modal="true"
        className="student-help-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="student-help-modal-head">
          <div>
            <p className="student-help-modal-eyebrow">SOS</p>
            <h2>Pedir Ayuda al Psicologo</h2>
          </div>
          <button
            aria-label="Cerrar"
            className="student-help-modal-close"
            type="button"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="student-help-modal-body">
          <div className="student-help-modal-note">
            Tu solicitud sera enviada directamente al psicologo del colegio. Es confidencial.
          </div>

          <label className="field">
            <span>Motivo de tu solicitud</span>
            <select
              value={form.reason}
              onChange={(event) => onFieldChange("reason", event.target.value)}
              disabled={loading}
            >
              {studentHelpRequestReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span>Nivel de urgencia</span>
            <div className="student-help-urgency-grid">
              {urgencyOptions.map((option) => (
                <button
                  key={option.value}
                  className={
                    form.urgency === option.value
                      ? "student-help-urgency student-help-urgency--active"
                      : "student-help-urgency"
                  }
                  type="button"
                  onClick={() => onFieldChange("urgency", option.value)}
                  disabled={loading}
                >
                  <span className={option.dotClassName} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>Mensaje (opcional)</span>
            <textarea
              rows={5}
              placeholder="Cuentame brevemente como te sientes..."
              value={form.message}
              onChange={(event) => onFieldChange("message", event.target.value)}
              disabled={loading}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}
        </div>

        <div className="student-help-modal-actions">
          <button className="btn btn--ghost" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn student-help-submit-btn" type="button" onClick={onSubmit} disabled={loading}>
            {loading ? "Enviando..." : "Enviar alerta al psicologo"}
          </button>
        </div>
      </div>
    </div>
  );
}
