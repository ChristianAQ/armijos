import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, Timestamp, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { DocumentData, DocumentType, StoredDocument } from "../types";

const documentsCol = collection(db, "documents");

export async function saveDocument(data: DocumentData): Promise<void> {
  await addDoc(documentsCol, { data, createdAt: serverTimestamp() });
}

export async function listDocuments(max = 50): Promise<StoredDocument[]> {
  const snap = await getDocs(query(documentsCol, orderBy("createdAt", "desc"), limit(max)));
  return snap.docs.map((d) => {
    const raw = d.data();
    return {
      id: d.id,
      data: raw.data as DocumentData,
      createdAt: (raw.createdAt as Timestamp)?.toMillis?.() ?? Date.now(),
    };
  });
}

/** Número de la factura creada más recientemente, para sugerir el siguiente
 * (el usuario puede editarlo igualmente antes de generar el PDF). */
export async function getLastFacturaNumber(): Promise<string | null> {
  const type: DocumentType = "factura";
  const snap = await getDocs(query(documentsCol, where("data.type", "==", type), orderBy("createdAt", "desc"), limit(1)));
  const data = snap.docs[0]?.data().data as DocumentData | undefined;
  return data?.type === "factura" ? data.number : null;
}
