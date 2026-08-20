export type PaymentMethod = "efectivo" | "cheque" | "tarjeta" | "transferencia";

export interface Client {
  id: string;
  name: string;
  cif: string;
  address: string;
  createdAt: number;
  updatedAt: number;
}

export interface LineItem {
  description: string;
  unitPrice: number;
  quantity: number;
}

export interface BusinessSettings {
  bankAccount: string;
}

export type DocumentType = "factura" | "presupuesto" | "aviso";

export interface FacturaData {
  type: "factura";
  number: string;
  date: string; // YYYY-MM-DD
  clientId: string | null;
  clientSnapshot: { name: string; cif: string; address: string };
  items: LineItem[];
  applyIva: boolean;
  paymentMethod: PaymentMethod;
  bankAccount: string;
}

export interface FacturaTemplate {
  id: string;
  name: string;
  clientId: string | null;
  clientSnapshot: { name: string; cif: string; address: string };
  items: LineItem[];
  applyIva: boolean;
  paymentMethod: PaymentMethod;
  bankAccount: string;
  createdAt: number;
  updatedAt: number;
}

export interface PresupuestoData {
  type: "presupuesto";
  date: string;
  clientId: string | null;
  clientSnapshot: { name: string; cif: string; address: string };
  workDescription: string;
  items: LineItem[];
  applyIva: boolean;
  paymentMethod: PaymentMethod;
  bankAccount: string;
}

export interface AvisoData {
  type: "aviso";
  date: string;
  zone: string;
  timeFrom: string; // HH:MM
  timeTo: string; // HH:MM
  reason: string;
  extraNote: string;
}

export type DocumentData = FacturaData | PresupuestoData | AvisoData;

export interface StoredDocument {
  id: string;
  createdAt: number;
  data: DocumentData;
}
