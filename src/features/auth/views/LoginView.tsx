import { useLoginController } from "@/features/auth/controllers/useLoginController";

export function LoginView() {
  const { error, form, isSubmitDisabled, loading, submit, updateField } = useLoginController();

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <div className="auth-hero">
          <p className="eyebrow">Sistema Escolar</p>
          <h1 className="page-title">Deteccion temprana de riesgo de ansiedad</h1>
          <p className="page-subtitle" style={{ color: "rgba(255,255,255,0.78)" }}>
            Plataforma institucional para evaluacion, seguimiento y monitoreo emocional en el entorno escolar.
          </p>
          <div className="auth-highlight-grid">
            <div className="auth-highlight">
              <strong>Acceso unificado</strong>
              <p>Ingresa con tu DNI y la contrasena asignada por la institucion.</p>
            </div>
            <div className="auth-highlight">
              <strong>Credenciales seguras</strong>
              <p>El sistema identifica internamente tu perfil y habilita tu modulo correspondiente.</p>
            </div>
            <div className="auth-highlight">
              <strong>Seguimiento centralizado</strong>
              <p>Gestion de usuarios, tamizajes y acompanamiento desde una sola plataforma.</p>
            </div>
          </div>
        </div>

        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div>
            <p className="eyebrow">Acceso</p>
            <h2 className="page-title" style={{ fontSize: "2rem" }}>
              Bienvenido
            </h2>
          </div>

          <label className="field">
            DNI
            <input
              value={form.identifier}
              onChange={(event) => updateField("identifier", event.target.value)}
              placeholder="Ingresa tu DNI"
              inputMode="numeric"
              maxLength={8}
            />
          </label>

          <label className="field">
            Contrasena
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Ingresa tu contrasena"
            />
          </label>

          <div className="cta-row">
            <button className="btn" type="submit" disabled={isSubmitDisabled}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
            <button className="btn btn--ghost" type="button">
              Recuperar acceso
            </button>
          </div>

          {error ? <p className="form-error">{error}</p> : null}
        </form>
      </div>
    </section>
  );
}
