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
export const SESSION_ACTIVITY_KEY = "ansiedad_app_last_activity";
export const SESSION_INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000;
const VALID_ROLES: UserRole[] = ["admin", "psicologo", "alumno"];
const ACTIVITY_WRITE_THROTTLE_MS = 15 * 1000;

function notifySessionChanged() {
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function saveSession(session: AppSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  markSessionActivity(true);
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
  localStorage.removeItem(SESSION_ACTIVITY_KEY);
  notifySessionChanged();
}

export function getLastSessionActivity() {
  const raw = localStorage.getItem(SESSION_ACTIVITY_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function markSessionActivity(force = false) {
  const now = Date.now();
  const lastActivity = getLastSessionActivity();

  if (!force && now - lastActivity < ACTIVITY_WRITE_THROTTLE_MS) {
    return;
  }

  localStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
}

export function subscribeToSessionChanges(callback: () => void) {
  window.addEventListener(SESSION_CHANGED_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(SESSION_CHANGED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
