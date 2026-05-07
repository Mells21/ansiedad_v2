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

export function saveSession(session: AppSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AppSession | null {
  const raw = localStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AppSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
