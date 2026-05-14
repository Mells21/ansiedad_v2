import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore/lite";
import type { LoginFormValues } from "@/features/auth/models/auth.model";
import { clearSession, getSession, saveSession } from "@/features/auth/services/session.service";
import { firebaseAuth, firebaseDb, isFirebaseConfigured } from "@/shared/lib/firebase";
import type { UserRole } from "@/shared/models/user.model";

const roleCollections: Array<{ role: UserRole; collectionName: string }> = [
  { role: "alumno", collectionName: "students" },
  { role: "psicologo", collectionName: "psychologists" },
  { role: "admin", collectionName: "admins" },
];

interface ResolvedIdentity {
  role: UserRole;
  collectionName: string;
  email: string;
  code: string;
}

function mapFirebaseAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return "No se pudo iniciar sesión.";
  }

  if (error.message.includes("auth/invalid-credential") || error.message.includes("auth/invalid-login-credentials")) {
    return "DNI o contraseña incorrectos.";
  }

  if (error.message.includes("auth/invalid-email")) {
    return "El DNI ingresado no es valido.";
  }

  if (error.message.includes("auth/user-disabled")) {
    return "Tu cuenta se encuentra deshabilitada.";
  }

  if (error.message.includes("auth/too-many-requests")) {
    return "Demasiados intentos. Intenta nuevamente en unos minutos.";
  }

  return error.message;
}

function toFirebaseEmail(identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  return normalized.includes("@") ? normalized : `${normalized}@gmail.com`;
}

async function findIdentityByUid(uid: string): Promise<ResolvedIdentity | null> {
  if (!firebaseDb) {
    return null;
  }

  for (const config of roleCollections) {
    const snapshot = await getDoc(doc(firebaseDb, config.collectionName, uid));

    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        role: config.role,
        collectionName: config.collectionName,
        email: (data.email as string | undefined) ?? "",
        code: (data.code as string | undefined) ?? "",
      };
    }
  }

  return null;
}

export async function login(values: LoginFormValues) {
  if (!isFirebaseConfigured || !firebaseAuth || !firebaseDb) {
    throw new Error("Firebase no esta configurado. Completa las variables VITE_FIREBASE_* en tu .env.");
  }

  const normalizedIdentifier = values.identifier.trim();
  const emailToUse = toFirebaseEmail(normalizedIdentifier);

  let credentials;

  try {
    credentials = await signInWithEmailAndPassword(firebaseAuth, emailToUse, values.password);
  } catch (error) {
    throw new Error(mapFirebaseAuthError(error));
  }
  const resolvedIdentity = await findIdentityByUid(credentials.user.uid);

  if (!resolvedIdentity) {
    throw new Error("El perfil del usuario no existe en Firestore.");
  }

  const profileDoc = await getDoc(doc(firebaseDb, resolvedIdentity.collectionName, credentials.user.uid));
  const profile = profileDoc.exists() ? profileDoc.data() : {};

  const session = {
    token: await credentials.user.getIdToken(),
    user: {
      id: credentials.user.uid,
      firebaseUid: credentials.user.uid,
      names: (profile.fullName as string | undefined) ?? credentials.user.displayName ?? "Usuario",
      email: credentials.user.email ?? emailToUse,
      code: (profile.code as string | undefined) ?? resolvedIdentity.code,
      role: resolvedIdentity.role,
      grade: (profile.grade as string | undefined) ?? "",
      section: (profile.section as string | undefined) ?? "",
    },
  };

  saveSession(session);
  return session;
}

export function getCurrentSession() {
  return getSession();
}

export function getHomeRouteForRole(role: UserRole) {
  if (role === "admin") {
    return "/admin";
  }
  if (role === "psicologo") {
    return "/psicologo";
  }
  return "/alumno";
}

export async function logout() {
  clearSession();

  if (firebaseAuth) {
    await signOut(firebaseAuth).catch(() => undefined);
  }
}
