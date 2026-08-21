import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { db, withRecovery } from "../lib/firebase";
import type { Client } from "../types";

const clientsCol = collection(db, "clients");

export async function listClients(): Promise<Client[]> {
  const snap = await withRecovery(() => getDocs(query(clientsCol, orderBy("name"))));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      cif: data.cif,
      address: data.address,
      createdAt: (data.createdAt as Timestamp)?.toMillis?.() ?? Date.now(),
      updatedAt: (data.updatedAt as Timestamp)?.toMillis?.() ?? Date.now(),
    };
  });
}

/** Crea el cliente si no existe uno con el mismo nombre (comparación simple,
 * suficiente para un directorio de un solo negocio), o actualiza sus datos si
 * ya existía. Devuelve el id del cliente. */
export async function upsertClient(input: { name: string; cif: string; address: string }, existing: Client[]): Promise<string> {
  const match = existing.find((c) => c.name.trim().toLowerCase() === input.name.trim().toLowerCase());
  if (match) {
    await updateDoc(doc(db, "clients", match.id), {
      cif: input.cif,
      address: input.address,
      updatedAt: serverTimestamp(),
    });
    return match.id;
  }
  const ref = await addDoc(clientsCol, {
    name: input.name.trim(),
    cif: input.cif.trim(),
    address: input.address.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
