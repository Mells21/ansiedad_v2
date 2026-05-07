import { NavLink, Outlet, useOutletContext } from "react-router-dom";
import { useAdminDashboard } from "@/features/admin/controllers/useAdminDashboard";
import type { AdminOutletContextValue } from "@/features/admin/models/admin-outlet-context.model";

export function AdminDashboardView() {
  const dashboard = useAdminDashboard();

  return (
    <section className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Administracion</p>
          <h1 className="admin-title">Panel de control</h1>
          <p className="admin-subtitle">
            Organiza usuarios y revisa el sistema desde vistas separadas, claras y directas.
          </p>
        </div>
        <div className="admin-header-actions">
          <div className="admin-session-chip">
            <strong>{dashboard.session?.user.names ?? "Administrador"}</strong>
            <span>{dashboard.session?.user.code ?? "Sesion activa"}</span>
          </div>
          <button className="btn btn--ghost" type="button" onClick={() => void dashboard.closeSession()}>
            Cerrar sesion
          </button>
        </div>
      </header>

      <nav className="admin-nav">
        <NavLink end className={({ isActive }) => (isActive ? "admin-nav-link admin-nav-link--active" : "admin-nav-link")} to="/admin">
          Inicio
        </NavLink>
        <NavLink className={({ isActive }) => (isActive ? "admin-nav-link admin-nav-link--active" : "admin-nav-link")} to="/admin/estudiantes">
          Estudiantes
        </NavLink>
        <NavLink className={({ isActive }) => (isActive ? "admin-nav-link admin-nav-link--active" : "admin-nav-link")} to="/admin/personal">
          Personal
        </NavLink>
        <NavLink className={({ isActive }) => (isActive ? "admin-nav-link admin-nav-link--active" : "admin-nav-link")} to="/admin/registrar">
          Registrar
        </NavLink>
        <NavLink className={({ isActive }) => (isActive ? "admin-nav-link admin-nav-link--active" : "admin-nav-link")} to="/admin/resumen">
          Resumen
        </NavLink>
      </nav>

      <Outlet context={dashboard} />
    </section>
  );
}

export function useAdminOutletContext() {
  return useOutletContext<AdminOutletContextValue>();
}
