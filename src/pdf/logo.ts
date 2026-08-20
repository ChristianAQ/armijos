import type { PDFDocument, PDFImage, PDFPage } from "pdf-lib";
import { LOGO_PNG_BASE64 } from "./assets/logo";

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Embebe el logotipo ARMIJOS (imagen real, ver ./assets/logo.ts) en el
 * documento. Se llama una vez por PDF, antes de dibujar el pie de página. */
export async function embedLogo(pdfDoc: PDFDocument): Promise<PDFImage> {
  return pdfDoc.embedPng(base64ToBytes(LOGO_PNG_BASE64));
}

const LOGO_SIZE = 46;

export function drawLogo(page: PDFPage, image: PDFImage, x: number, y: number) {
  page.drawImage(image, { x, y, width: LOGO_SIZE, height: LOGO_SIZE });
}
