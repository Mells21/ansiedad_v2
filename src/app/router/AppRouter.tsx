import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "@/app/layouts/DashboardLayout";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { getCurrentSession, getHomeRouteForRole } from "@/features/auth/services/auth.service";
import { subscribeToSessionChanges, type AppSession } from "@/features/auth/services/session.service";
import { LoginView } from "@/features/auth/views/LoginView";
import { PsychologistDashboardView } from "@/features/psychologist/views/PsychologistDashboardView";
import { StudentDashboardView } from "@/features/student/views/StudentDashboardView";
import { AdminDashboardView } from "@/features/admin/views/AdminDashboardView";
import { AdminHomeView } from "@/features/admin/views/AdminHomeView";
import { AdminPeopleView } from "@/features/admin/views/AdminPeopleView";
import { AdminRegisterView } from "@/features/admin/views/AdminRegisterView";
import { AdminStudentsView } from "@/features/admin/views/AdminStudentsView";
import { AdminSummaryView } from "@/features/admin/views/AdminSummaryView";
import { PsychologistStatsView } from "@/features/psychologist/views/PsychologistStatsView";
import { TestSchedulerView } from "@/features/psychologist/views/TestSchedulerView";
import { PsychologistAlertsView } from "@/features/psychologist/views/PsychologistAlertsView";

export function AppRouter() {
  const [session, setSession] = useState<AppSession | null>(() => getCurrentSession());
  const homeRoute = session ? getHomeRouteForRole(session.user.role) : "/login";

  useEffect(() => subscribeToSessionChanges(() => {
    setSession(getCurrentSession());
  }), []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homeRoute} replace />} />
      <Route path="/login" element={session ? <Navigate to={homeRoute} replace /> : <LoginView />} />
      <Route element={<DashboardLayout />}>
        <Route element={<ProtectedRoute allow={["psicologo"]} />}>
          <Route path="/psicologo" element={<PsychologistDashboardView />} />
          <Route path="/psicologo/alertas" element={<PsychologistAlertsView />} />
          <Route path="/psicologo/estadisticas" element={<PsychologistStatsView />} />
          <Route path="/psicologo/programacion" element={<TestSchedulerView />} />
        </Route>

        <Route element={<ProtectedRoute allow={["alumno"]} />}>
          <Route path="/alumno" element={<StudentDashboardView />} />
        </Route>

        <Route element={<ProtectedRoute allow={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboardView />}>
            <Route index element={<AdminHomeView />} />
            <Route path="estudiantes" element={<AdminStudentsView />} />
            <Route path="estudiantes/:grade" element={<AdminStudentsView />} />
            <Route path="estudiantes/:grade/:section" element={<AdminStudentsView />} />
            <Route path="personal" element={<AdminPeopleView />} />
            <Route path="registrar" element={<AdminRegisterView />} />
            <Route path="resumen" element={<AdminSummaryView />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={homeRoute} replace />} />
    </Routes>
  );
}
