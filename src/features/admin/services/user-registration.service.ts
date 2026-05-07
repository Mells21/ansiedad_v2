import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore/lite";
import type { ManagedUserFormValues } from "@/features/admin/models/user-registration.model";
import { firebaseConfig, isFirebaseConfigured } from "@/shared/lib/firebase";

function buildGradeSection(grade: string, section: string) {
  return [grade, section].filter(Boolean).join(" ");
}

function toFirebaseEmailFromDni(dni: string) {
  return `${dni.trim().toLowerCase()}@gmail.com`;
}

export async function registerManagedUser(form: ManagedUserFormValues) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase no esta configurado. Revisa tu archivo .env.");
  }

  const appName = `registration-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, appName);
  const auth = getAuth(secondaryApp);
  const db = getFirestore(secondaryApp);

  try {
    const generatedEmail = toFirebaseEmailFromDni(form.dni);
    const credentials = await createUserWithEmailAndPassword(auth, generatedEmail, form.password);
    const gradeSection = buildGradeSection(form.grade, form.section);

    if (form.role === "alumno") {
      await setDoc(doc(db, "students", credentials.user.uid), {
        fullName: form.fullName,
        email: generatedEmail,
        code: form.dni,
        grade: form.grade,
        section: form.section,
        gradeSection,
        role: form.role,
        createdAt: new Date().toISOString(),
      });
    } else if (form.role === "psicologo") {
      await setDoc(doc(db, "psychologists", credentials.user.uid), {
        fullName: form.fullName,
        email: generatedEmail,
        code: form.dni,
        role: form.role,
        createdAt: new Date().toISOString(),
      });
    } else {
      await setDoc(doc(db, "admins", credentials.user.uid), {
        fullName: form.fullName,
        email: generatedEmail,
        code: form.dni,
        role: form.role,
        createdAt: new Date().toISOString(),
      });
    }

    return {
      uid: credentials.user.uid,
      email: credentials.user.email ?? generatedEmail,
      role: form.role,
    };
  } finally {
    await auth.signOut().catch(() => undefined);
    await deleteApp(secondaryApp).catch(() => undefined);
  }
}
