import type { PDFDocument, PDFImage } from "pdf-lib";
import { LOGO_PNG_BASE64 } from "./assets/logo";

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Embebe el logotipo ARMIJOS (imagen real, ver ./assets/logo.ts) en el
 * documento. Se llama una vez por PDF, antes de dibujar la cabecera. */
export async function embedLogo(pdfDoc: PDFDocument): Promise<PDFImage> {
  return pdfDoc.embedPng(base64ToBytes(LOGO_PNG_BASE64));
}
