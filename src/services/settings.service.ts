import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, withRecovery } from "../lib/firebase";
import { DEFAULT_BUSINESS } from "../config/business";
import type { BusinessSettings } from "../types";

const settingsRef = doc(db, "settings", "business");

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const snap = await withRecovery(() => getDoc(settingsRef));
  return { ...DEFAULT_BUSINESS, ...(snap.data() as Partial<BusinessSettings> | undefined) };
}

export async function saveBusinessSettings(settings: BusinessSettings): Promise<void> {
  await setDoc(settingsRef, settings, { merge: true });
}
