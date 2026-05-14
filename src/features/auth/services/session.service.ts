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
const SESSION_CHANGED_EVENT = "ansiedad-app-session-changed";
const VALID_ROLES: UserRole[] = ["admin", "psicologo", "alumno"];

function notifySessionChanged() {
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function saveSession(session: AppSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notifySessionChanged();
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
  notifySessionChanged();
}

export function subscribeToSessionChanges(callback: () => void) {
  window.addEventListener(SESSION_CHANGED_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(SESSION_CHANGED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
