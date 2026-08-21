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

/** Datos fijos del emisor, editables en Ajustes (un único sitio) en vez de
 * estar repartidos por el código. `address` puede llevar un salto de línea
 * para partirla en dos líneas al imprimirla. */
export interface BusinessSettings {
  name: string;
  owner: string;
  dni: string;
  phone: string;
  email: string;
  address: string;
  termsText: string;
  bankAccount: string;
}

/** "clasico": diseño original con cuña verde y cajas con borde.
 * "moderno": diseño más minimalista, sin cuña, con bloques de fondo suave. */
export type PdfDesign = "clasico" | "moderno";

export type DocumentType = "factura" | "presupuesto" | "aviso";

export interface FacturaData {
  type: "factura";
  number: string;
  date: string; // YYYY-MM-DD
  design: PdfDesign;
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
  design: PdfDesign;
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
  design: PdfDesign;
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
