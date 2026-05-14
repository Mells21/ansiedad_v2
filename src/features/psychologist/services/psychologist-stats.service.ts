import { collection, doc, getDoc, getDocs } from "firebase/firestore/lite";
import { firebaseDb, isFirebaseConfigured } from "@/shared/lib/firebase";
import type { StudentAssessment, StudentDiagnosis } from "@/features/student/models/student-case.model";
import { ServiceCache } from "@/shared/lib/cache";

export interface StudentStatsEntry {
  gradeSection: string;
  gender: string;
  latestDiagnosis: StudentDiagnosis | null;
  latestAssessment: StudentAssessment | null;
}

export async function fetchAllStudentStats(): Promise<StudentStatsEntry[]> {
  const cached = ServiceCache.get<StudentStatsEntry[]>("all_student_stats");
  if (cached) return cached;

  if (!isFirebaseConfigured || !firebaseDb) return [];
  const db = firebaseDb;

  const studentsSnapshot = await getDocs(collection(db, "students"));
  const studentPromises = studentsSnapshot.docs.map(async (studentDoc) => {
    const data = studentDoc.data();
    const studentId = studentDoc.id;
    const gradeSection = (data.gradeSection || [data.grade, data.section].filter(Boolean).join(" ") || "Sin seccion") as string;
    const gender = (data.gender || "otro") as string;

    const assessmentsSnapshot = await getDocs(collection(db, "students", studentId, "assessments"));
    const sortedAssessments = assessmentsSnapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as StudentAssessment))
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    
    const latestAssessment = sortedAssessments[0] || null;

    // Get latest diagnosis
    let latestDiagnosis: StudentDiagnosis | null = null;
    if (latestAssessment) {
      const diagnosisDoc = await getDoc(doc(db, "students", studentId, "diagnoses", String(latestAssessment.id)));
      if (diagnosisDoc.exists()) {
        latestDiagnosis = { id: diagnosisDoc.id, ...diagnosisDoc.data() } as StudentDiagnosis;
      }
    }

    return { gradeSection, gender, latestAssessment, latestDiagnosis };
  });

  const results = await Promise.all(studentPromises);
  ServiceCache.set("all_student_stats", results);
  return results;
}
