import { collection, getDocs, doc, getDoc } from "firebase/firestore/lite";
import { firebaseDb, isFirebaseConfigured } from "@/shared/lib/firebase";
import type { StudentProfile, StudentDiagnosis, StudentAssessment } from "@/features/student/models/student-case.model";
import { ServiceCache } from "@/shared/lib/cache";

export interface StudentStatsEntry {
  student: StudentProfile;
  latestDiagnosis: StudentDiagnosis | null;
  latestAssessment: StudentAssessment | null;
}

export async function fetchAllStudentStats(): Promise<StudentStatsEntry[]> {
  const cached = ServiceCache.get<StudentStatsEntry[]>("all_student_stats");
  if (cached) return cached;

  if (!isFirebaseConfigured || !firebaseDb) return [];
  const db = firebaseDb;

  const studentsSnapshot = await getDocs(collection(db, "students"));
  const stats: StudentStatsEntry[] = [];

  const studentPromises = studentsSnapshot.docs.map(async (studentDoc) => {
    const data = studentDoc.data();
    const studentId = studentDoc.id;
    
    // Parse student profile
    const student: StudentProfile = {
      id: studentId,
      code: data.code || "",
      fullName: data.fullName || "Estudiante",
      gender: data.gender || "otro",
      gradeSection: data.gradeSection || [data.grade, data.section].filter(Boolean).join(" "),
      livesWithParents: !!data.livesWithParents,
      parentsValue: data.livesWithParents ? 1 : 0,
      economicSituation: data.economicSituation || 1,
      sleepHours: data.sleepHours || 7,
      sleepValue: 0, // Not needed for general stats
      extracurricularFrequency: data.extracurricularFrequency || 1,
      studyHours: data.studyHours || 2,
      studyValue: 0,
      createdAt: data.createdAt || "",
      updatedAt: data.updatedAt || "",
    };

    // Get latest assessment
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

    return { student, latestAssessment, latestDiagnosis };
  });

  const results = await Promise.all(studentPromises);
  ServiceCache.set("all_student_stats", results);
  return results;
}
