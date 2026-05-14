import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getCurrentSession, logout } from "@/features/auth/services/auth.service";
import { subscribeToSessionChanges, type AppSession } from "@/features/auth/services/session.service";
import { getPendingHelpAlertsCount } from "@/features/psychologist/services/psychologist.service";
import {
  getStudentHelpResponseNotificationCount,
  getStudentHelpResponsesEventName,
} from "@/features/student/services/student.service";

export function GlobalNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<AppSession | null>(() => getCurrentSession());
  const role = session?.user.role;
  const [pendingHelpAlertsCount, setPendingHelpAlertsCount] = useState(0);
  const [studentHelpResponseCount, setStudentHelpResponseCount] = useState(0);

  useEffect(() => subscribeToSessionChanges(() => {
    setSession(getCurrentSession());
  }), []);

  useEffect(() => {
    if (role !== "psicologo") {
      return;
    }

    const reloadPendingCount = () => {
      getPendingHelpAlertsCount()
        .then(setPendingHelpAlertsCount)
        .catch(() => setPendingHelpAlertsCount(0));
    };

    reloadPendingCount();
    window.addEventListener("psychologist-help-alerts-updated", reloadPendingCount);

    return () => {
      window.removeEventListener("psychologist-help-alerts-updated", reloadPendingCount);
    };
  }, [role]);

  useEffect(() => {
    if (role !== "alumno") {
      setStudentHelpResponseCount(0);
      return;
    }

    const eventName = getStudentHelpResponsesEventName();
    const reloadNotificationCount = () => {
      getStudentHelpResponseNotificationCount()
        .then(setStudentHelpResponseCount)
        .catch(() => setStudentHelpResponseCount(0));
    };

    reloadNotificationCount();
    window.addEventListener(eventName, reloadNotificationCount);

    return () => {
      window.removeEventListener(eventName, reloadNotificationCount);
    };
  }, [role]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (role !== "psicologo") {
      setPendingHelpAlertsCount(0);
    } else {
      getPendingHelpAlertsCount().then(setPendingHelpAlertsCount).catch(() => setPendingHelpAlertsCount(0));
    }

    if (role === "alumno") {
      getStudentHelpResponseNotificationCount().then(setStudentHelpResponseCount).catch(() => setStudentHelpResponseCount(0));
    }
  }, [location.pathname, role]);

  const getLinks = () => {
    if (role === "admin") {
      return [
        { to: "/admin", label: "Inicio", end: true },
        { to: "/admin/estudiantes", label: "Estudiantes" },
        { to: "/admin/personal", label: "Personal" },
        { to: "/admin/registrar", label: "Registrar" },
      ];
    }
    if (role === "psicologo") {
      return [
        { to: "/psicologo", label: "Casos", end: true },
        { to: "/psicologo/alertas", label: "Alertas", badge: pendingHelpAlertsCount },
        { to: "/psicologo/estadisticas", label: "Estadísticas" },
        { to: "/psicologo/programacion", label: "Programación" },
      ];
    }
    if (role === "alumno") {
      return [
        { to: "/alumno?tab=inicio", label: "Inicio", end: true, matchSearch: "tab=inicio" },
        { to: "/alumno?tab=test", label: "Nuevo Test", matchSearch: "tab=test" },
        { to: "/alumno?tab=historial", label: "Mi Historial", matchSearch: "tab=historial" },
        { to: "/alumno?tab=ayuda", label: "Ayuda", matchSearch: "tab=ayuda", badge: studentHelpResponseCount },
      ];
    }
    return [];
  };

  const navLinks = getLinks();

  return (
    <nav className="global-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">▲</span>
            <strong>Ansiedad<span>App</span></strong>
          </Link>
        </div>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => {
                const matchesSearch = "matchSearch" in link
                  ? location.pathname === "/alumno" && location.search === `?${link.matchSearch}`
                  : isActive;
                return matchesSearch ? "nav-link nav-link--active" : "nav-link";
              }}
            >
              <span>{link.label}</span>
              {"badge" in link && link.badge && link.badge > 0 ? (
                <span className="nav-link-badge">{link.badge}</span>
              ) : null}
            </NavLink>
          ))}
        </div>

        <div className="navbar-actions">
          <div className="navbar-profile">
            <div className="profile-info">
              <strong>{session?.user.names ?? "Usuario"}</strong>
              <span>{role === "psicologo" ? "Psicólogo" : role === "admin" ? "Admin" : "Estudiante"}</span>
            </div>
            <button className="btn btn--ghost navbar-logout" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
