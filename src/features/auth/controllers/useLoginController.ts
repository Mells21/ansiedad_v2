import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LoginFormValues } from "@/features/auth/models/auth.model";
import { login } from "@/features/auth/services/auth.service";

const defaultValues: LoginFormValues = {
  identifier: "",
  password: "",
};

export function useLoginController() {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginFormValues>(defaultValues);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const normalizedIdentifier = form.identifier.trim();
  const normalizedPassword = form.password.trim();
  const isSubmitDisabled = loading;

  const updateField = <K extends keyof LoginFormValues>(field: K, value: LoginFormValues[K]) => {
    setForm((current) => ({
      ...current,
      [field]:
        field === "identifier"
          ? (String(value).replace(/\D/g, "").slice(0, 8) as LoginFormValues[K])
          : value,
    }));
    setError(null);
  };

  const submit = async () => {
    if (!normalizedIdentifier && !normalizedPassword) {
      setError("Ingresa tu DNI y tu contrasena.");
      return;
    }

    if (!normalizedIdentifier) {
      setError("Ingresa tu DNI.");
      return;
    }

    if (!/^\d{8}$/.test(normalizedIdentifier)) {
      setError("Ingresa un DNI valido de 8 digitos.");
      return;
    }

    if (!normalizedPassword) {
      setError("Ingresa tu contrasena.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await login({
        identifier: normalizedIdentifier,
        password: normalizedPassword,
      });

      if (session.user.role === "psicologo") {
        navigate("/psicologo");
        return;
      }

      if (session.user.role === "alumno") {
        navigate("/alumno");
        return;
      }

      navigate("/admin");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No se pudo iniciar sesion.");
    } finally {
      setLoading(false);
    }
  };

  return {
    error,
    form,
    isSubmitDisabled,
    loading,
    submit,
    updateField,
  };
}
