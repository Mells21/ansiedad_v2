import type { ModelMetrics } from "@/features/admin/models/model-metrics.model";
import type { ManagedUserDirectoryEntry } from "@/features/admin/models/managed-user-directory.model";
import modelMetricsSnapshot from "@/shared/ml/modelMetrics.json";
import { collection, getDocs } from "firebase/firestore/lite";
import { firebaseAuth, firebaseDb, isFirebaseConfigured, waitForFirebaseAuthReady } from "@/shared/lib/firebase";
import { ServiceCache } from "@/shared/lib/cache";

export async function getModelMetrics(): Promise<ModelMetrics> {
  return modelMetricsSnapshot as ModelMetrics;
}

function sortByName(entries: ManagedUserDirectoryEntry[]) {
  return [...entries].sort((left, right) => left.fullName.localeCompare(right.fullName, "es"));
}

export async function getManagedUsers() {
  const cached = ServiceCache.get<any>("managed_users");
  if (cached) return cached;

  if (!isFirebaseConfigured || !firebaseDb || !firebaseAuth) {
    throw new Error("Firebase no esta configurado.");
  }

  await waitForFirebaseAuthReady();

  if (!firebaseAuth.currentUser) {
    throw new Error("La sesion del administrador aun no esta lista. Recarga e intenta nuevamente.");
  }

  const [studentsSnapshot, psychologistsSnapshot, adminsSnapshot] = await Promise.all([
    getDocs(collection(firebaseDb, "students")),
    getDocs(collection(firebaseDb, "psychologists")),
    getDocs(collection(firebaseDb, "admins")),
  ]);

  const students = sortByName(
    studentsSnapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        fullName: (data.fullName as string | undefined) ?? "Sin nombre",
        email: (data.email as string | undefined) ?? "",
        code: (data.code as string | undefined) ?? "",
        role: "alumno" as const,
        grade: (data.grade as string | undefined) ?? "",
        section: (data.section as string | undefined) ?? "",
        gradeSection: (data.gradeSection as string | undefined) ?? "",
        createdAt: (data.createdAt as string | undefined) ?? "",
      };
    }),
  );

  const psychologists = sortByName(
    psychologistsSnapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        fullName: (data.fullName as string | undefined) ?? "Sin nombre",
        email: (data.email as string | undefined) ?? "",
        code: (data.code as string | undefined) ?? "",
        role: "psicologo" as const,
        createdAt: (data.createdAt as string | undefined) ?? "",
      };
    }),
  );

  const admins = sortByName(
    adminsSnapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        fullName: (data.fullName as string | undefined) ?? "Sin nombre",
        email: (data.email as string | undefined) ?? "",
        code: (data.code as string | undefined) ?? "",
        role: "admin" as const,
        createdAt: (data.createdAt as string | undefined) ?? "",
      };
    }),
  );

  const results = {
    students,
    psychologists,
    admins,
  };

  ServiceCache.set("managed_users", results);
  return results;
}
