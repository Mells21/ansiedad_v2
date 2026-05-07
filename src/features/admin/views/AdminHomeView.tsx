import { Link } from "react-router-dom";
import { PanelCard } from "@/shared/components/PanelCard";
import { useAdminOutletContext } from "@/features/admin/views/AdminDashboardView";

export function AdminHomeView() {
  const { admins, psychologists, students, totalUsers } = useAdminOutletContext();

  return (
    <div className="admin-shell">
      <div className="admin-overview-grid">
        <PanelCard
          title="Estudiantes"
          subtitle="Explora grados, secciones y encuentra alumnos con el buscador global."
          action={<span className="pill">{students.length}</span>}
        >
          <Link className="admin-card-link" to="/admin/estudiantes">
            Abrir vista de estudiantes
          </Link>
        </PanelCard>

        <PanelCard
          title="Personal"
          subtitle="Revisa psicologos y administradores registrados en el sistema."
          action={<span className="pill">{psychologists.length + admins.length}</span>}
        >
          <Link className="admin-card-link" to="/admin/personal">
            Ver personal registrado
          </Link>
        </PanelCard>

        <PanelCard
          title="Registrar usuario"
          subtitle="Crea nuevas cuentas para alumnos, psicologos o administradores."
          action={<span className="pill">Nuevo</span>}
        >
          <Link className="admin-card-link" to="/admin/registrar">
            Ir al formulario
          </Link>
        </PanelCard>
      </div>

      <PanelCard
        title="Resumen rapido"
        subtitle="Accesos principales del panel administrativo."
        action={<span className="pill">{totalUsers} usuarios</span>}
      >
        <div className="admin-summary-strip">
          <div className="soft-panel">
            <p className="summary-label">Alumnos</p>
            <strong className="summary-value">{students.length}</strong>
          </div>
          <div className="soft-panel">
            <p className="summary-label">Psicologos</p>
            <strong className="summary-value">{psychologists.length}</strong>
          </div>
          <div className="soft-panel">
            <p className="summary-label">Admins</p>
            <strong className="summary-value">{admins.length}</strong>
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
