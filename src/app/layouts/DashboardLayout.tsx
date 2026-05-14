import { Outlet, useLocation } from "react-router-dom";
import { GlobalNavbar } from "@/shared/components/GlobalNavbar";
import "@/app/styles/dashboard.css";

export function DashboardLayout() {
  const location = useLocation();
  
  const isPsychologistRoute = location.pathname.startsWith("/psicologo");
  const isStudentRoute = location.pathname.startsWith("/alumno");
  const isAdminRoute = location.pathname.startsWith("/admin");

  const layoutClass = isAdminRoute 
    ? "admin-layout" 
    : isPsychologistRoute 
      ? "psychologist-layout" 
      : "student-layout";

  return (
    <div className="app-layout">
      <GlobalNavbar />
      <main className={layoutClass}>
        <Outlet />
      </main>
    </div>
  );
}
