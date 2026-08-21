import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { db, withRecovery } from "../lib/firebase";
import type { FacturaTemplate, LineItem, PaymentMethod, PdfDesign } from "../types";

const templatesCol = collection(db, "facturaTemplates");

export interface TemplateInput {
  name: string;
  design: PdfDesign;
  clientId: string | null;
  clientSnapshot: { name: string; cif: string; address: string };
  items: LineItem[];
  applyIva: boolean;
  paymentMethod: PaymentMethod;
  bankAccount: string;
}

export async function listTemplates(): Promise<FacturaTemplate[]> {
  const snap = await withRecovery(() => getDocs(query(templatesCol, orderBy("name"))));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      design: (data.design as PdfDesign | undefined) ?? "clasico",
      clientId: data.clientId,
      clientSnapshot: data.clientSnapshot,
      items: data.items,
      applyIva: data.applyIva,
      paymentMethod: data.paymentMethod,
      bankAccount: data.bankAccount,
      createdAt: (data.createdAt as Timestamp)?.toMillis?.() ?? Date.now(),
      updatedAt: (data.updatedAt as Timestamp)?.toMillis?.() ?? Date.now(),
    };
  });
}

export async function createTemplate(input: TemplateInput): Promise<string> {
  const ref = await addDoc(templatesCol, { ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateTemplate(id: string, input: TemplateInput): Promise<void> {
  await updateDoc(doc(db, "facturaTemplates", id), { ...input, updatedAt: serverTimestamp() });
}

export async function deleteTemplate(id: string): Promise<void> {
  await deleteDoc(doc(db, "facturaTemplates", id));
}
