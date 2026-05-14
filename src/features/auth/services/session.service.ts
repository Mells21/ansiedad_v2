import type { UserRole } from "@/shared/models/user.model";

export interface AppSessionUser {
  id: string;
  firebaseUid?: string;
  names: string;
  email?: string;
  code?: string;
  role: UserRole;
  grade?: string;
  section?: string;
}

export interface AppSession {
  token: string;
  user: AppSessionUser;
}

const SESSION_KEY = "ansiedad_app_session";
const VALID_ROLES: UserRole[] = ["admin", "psicologo", "alumno"];

export function saveSession(session: AppSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AppSession | null {
  const raw = localStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AppSession;

    if (!parsed?.token || !parsed?.user?.id || !VALID_ROLES.includes(parsed.user.role)) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
