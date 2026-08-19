import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { BusinessSettings } from "../types";

const settingsRef = doc(db, "settings", "business");

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const snap = await getDoc(settingsRef);
  return { bankAccount: (snap.data()?.bankAccount as string) ?? "" };
}

export async function saveBusinessSettings(settings: BusinessSettings): Promise<void> {
  await setDoc(settingsRef, settings, { merge: true });
}
