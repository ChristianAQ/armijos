import type { PDFFont, PDFPage } from "pdf-lib";
import { COLORS } from "./theme";
import { BUSINESS } from "../config/business";

// Emblema vectorial ARMIJOS: un triángulo tipo "montaña" sobre el nombre de
// marca. No es una copia exacta del logo original (que está dibujado como
// gráficos vectoriales dentro del PDF fuente y no se pudo extraer como
// imagen), pero usa los mismos colores de marca. Si en el futuro se dispone
// del logo original en PNG/SVG, puede sustituirse aquí sin tocar el resto.
export function drawLogo(page: PDFPage, fontBold: PDFFont, x: number, y: number) {
  // Triángulo (pico de montaña), centrado sobre el texto
  const triW = 26;
  const triH = 20;
  page.drawSvgPath(`M${triW / 2},0 L${triW},${triH} L0,${triH} Z`, {
    x: x,
    y: y + triH,
    color: COLORS.green,
  });
  // Texto de marca
  const size = 15;
  const text = BUSINESS.brand;
  const textWidth = fontBold.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: x + triW / 2 - textWidth / 2,
    y: y - size + 2,
    size,
    font: fontBold,
    color: COLORS.white,
  });
}
