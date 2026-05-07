import { NavLink, Outlet, useLocation } from "react-router-dom";
import "@/app/styles/dashboard.css";

const links = [
  { to: "/psicologo", label: "Psicologo" },
  { to: "/alumno", label: "Alumno" },
  { to: "/admin", label: "Administrador" },
];

export function DashboardLayout() {
  const location = useLocation();
  const isPsychologistRoute = location.pathname === "/psicologo";
  const isStudentRoute = location.pathname === "/alumno";
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isPsychologistRoute || isStudentRoute || isAdminRoute) {
    return (
      <main
        className={
          isAdminRoute ? "admin-layout" : isPsychologistRoute ? "psychologist-layout" : "student-layout"
        }
      >
        <Outlet />
      </main>
    );
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div>
          <p className="eyebrow">Rioja, San Martin</p>
          <h1 className="sidebar-title">Tamizaje de Ansiedad</h1>
          <p className="sidebar-copy">
            Plataforma escolar para evaluacion, seguimiento y alertas tempranas.
          </p>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link--active" : "sidebar-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Dashboard escolar</p>
            <strong className="topbar-title">Centro de monitoreo emocional</strong>
          </div>
          <div className="topbar-actions">
            <button className="btn btn--ghost" type="button">
              Reportes
            </button>
            <div className="profile-chip">
              <span className="profile-avatar">MS</span>
              <div>
                <strong>Melany System</strong>
                <p>Sesion demo</p>
              </div>
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
