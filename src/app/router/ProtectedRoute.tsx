import { Navigate, Outlet } from "react-router-dom";
import { getCurrentSession, getHomeRouteForRole } from "@/features/auth/services/auth.service";
import type { UserRole } from "@/shared/models/user.model";

interface ProtectedRouteProps {
  allow: UserRole[];
}

export function ProtectedRoute({ allow }: ProtectedRouteProps) {
  const session = getCurrentSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(session.user.role)) {
    return <Navigate to={getHomeRouteForRole(session.user.role)} replace />;
  }

  return <Outlet />;
}
