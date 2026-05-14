import { doc, getDoc, setDoc } from "firebase/firestore/lite";
import { firebaseDb, isFirebaseConfigured } from "@/shared/lib/firebase";
import type { TestScheduleConfig } from "@/features/student/models/test-config.model";

const CONFIG_DOC_ID = "global_assessment_config";

export async function getTestScheduleConfig(): Promise<TestScheduleConfig | null> {
  if (!isFirebaseConfigured || !firebaseDb) return null;
  
  const configRef = doc(firebaseDb, "config", CONFIG_DOC_ID);
  const snapshot = await getDoc(configRef);
  
  if (!snapshot.exists()) return null;
  
  return snapshot.data() as TestScheduleConfig;
}

export async function updateTestScheduleConfig(config: TestScheduleConfig): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  
  const configRef = doc(firebaseDb, "config", CONFIG_DOC_ID);
  await setDoc(configRef, {
    ...config,
    updatedAt: new Date().toISOString()
  });
}
