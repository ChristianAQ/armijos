import type { PDFFont, PDFImage, PDFPage } from "pdf-lib";
import { COLORS, PAGE } from "./theme";
import { drawLogo } from "./logo";
import { BUSINESS } from "../config/business";

export interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

const HEADER_HEIGHT = 180;
const HEADER_LOGO_SIZE = 70;
const FOOTER_WEDGE_HEIGHT = 85;
const FOOTER_BAR_HEIGHT = 14;

export function formatEUR(n: number): string {
  return `${n.toFixed(2)} €`;
}

export function formatDateEs(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** "N.º 00035": el número de factura tal y como se muestra en la cabecera
 * del PDF, con ceros a la izquierda hasta 5 cifras. El número guardado
 * (Firestore, nombre de archivo, formulario) no se toca, esto es solo
 * presentación. */
export function formatFacturaNumber(number: string): string {
  return `N.º ${number.padStart(5, "0")}`;
}

export function wrapText(font: PDFFont, size: number, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ").filter(Boolean);
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    lines.push(current);
  }
  return lines;
}

/** Dibuja la banda diagonal superior con el logotipo, el nombre del negocio
 * debajo y, opcionalmente, una etiqueta (p.ej. ["FACTURA", "N.º 00035"])
 * dentro de la cuña de color. Devuelve la coordenada Y (sistema de páginas,
 * origen abajo) donde empieza el contenido libre. */
export function drawHeader(page: PDFPage, fonts: Fonts, logoImage: PDFImage, labelLines: string[] = []): number {
  const W = PAGE.width;
  const H = HEADER_HEIGHT;
  const top = PAGE.height;

  page.drawSvgPath(`M${W - 190},0 L${W},0 L${W},${H} L${W - 260},${H} Z`, {
    x: 0,
    y: top,
    color: COLORS.darkGreen,
  });
  page.drawSvgPath(`M${W - 214},0 L${W - 198},0 L${W - 268},${H} L${W - 284},${H} Z`, {
    x: 0,
    y: top,
    color: COLORS.green,
  });

  // Margen superior: el mismo que se usa a los lados del documento
  // (PAGE.margin), y un poco más, para que la cabecera no quede pegada al
  // borde de la página.
  const topMargin = PAGE.margin + 6;

  if (labelLines.length) {
    // Centrada verticalmente en la cabecera (ahora más alta por el logo).
    let ly = top - H / 2 + 14;
    labelLines.forEach((line, i) => {
      const size = i === 0 ? 18 : 26;
      const w = fonts.bold.widthOfTextAtSize(line, size);
      page.drawText(line, { x: W - PAGE.margin - w, y: ly, size, font: fonts.bold, color: COLORS.white });
      ly -= size + 4;
    });
  }

  // Logotipo (icono + "ARMIJOS"), más grande y por encima del nombre del
  // negocio, que a su vez se reduce para no competir con él.
  page.drawImage(logoImage, { x: PAGE.margin, y: top - topMargin - HEADER_LOGO_SIZE, width: HEADER_LOGO_SIZE, height: HEADER_LOGO_SIZE });

  // Bloque de datos del emisor, a la izquierda de la cuña: nombre del
  // negocio (más pequeño, bajo el logo), luego titular+DNI, contacto y
  // dirección agrupados en una línea cada uno.
  let y = top - topMargin - HEADER_LOGO_SIZE - 10;
  page.drawText(BUSINESS.name, { x: PAGE.margin, y, size: 10, font: fonts.bold, color: COLORS.black });
  y -= 15;

  page.drawText(`${BUSINESS.owner} · DNI ${BUSINESS.dni}`, {
    x: PAGE.margin,
    y,
    size: 9.5,
    font: fonts.regular,
    color: COLORS.gray,
  });
  y -= 15;

  page.drawText(`${BUSINESS.phone} · ${BUSINESS.email}`, {
    x: PAGE.margin,
    y,
    size: 9.5,
    font: fonts.bold,
    color: COLORS.navy,
  });
  y -= 15;

  page.drawText(BUSINESS.addressLines.join(" ").replace(/,$/, ""), {
    x: PAGE.margin,
    y,
    size: 9.5,
    font: fonts.regular,
    color: COLORS.gray,
  });

  return top - H - 14;
}

/** Línea fina horizontal, usada para separar el bloque del emisor del resto
 * del documento y darle una estructura más clara. */
export function drawDivider(page: PDFPage, opts: { x: number; y: number; width: number }): number {
  page.drawLine({
    start: { x: opts.x, y: opts.y },
    end: { x: opts.x + opts.width, y: opts.y },
    thickness: 1,
    color: COLORS.borderGray,
  });
  return opts.y - 16;
}

/** Mini-titular de sección (p.ej. "DATOS DEL CLIENTE") en versalitas de
 * marca, para separar visualmente los bloques del documento. */
export function drawMiniHeading(page: PDFPage, fonts: Fonts, opts: { x: number; y: number; text: string }): number {
  page.drawText(opts.text, { x: opts.x, y: opts.y, size: 9.5, font: fonts.bold, color: COLORS.deepGreen });
  return opts.y - 16;
}

export function drawFooter(page: PDFPage, logoImage: PDFImage) {
  const W = PAGE.width;
  const Hf = FOOTER_WEDGE_HEIGHT;
  const barTop = FOOTER_BAR_HEIGHT;

  page.drawRectangle({ x: 0, y: 0, width: W, height: barTop, color: COLORS.darkGreen });

  page.drawSvgPath(`M0,0 L190,0 L260,${Hf} L0,${Hf} Z`, {
    x: 0,
    y: barTop + Hf,
    color: COLORS.darkGreen,
  });
  page.drawSvgPath(`M198,0 L214,0 L284,${Hf} L268,${Hf} Z`, {
    x: 0,
    y: barTop + Hf,
    color: COLORS.green,
  });

  drawLogo(page, logoImage, 20, 18);
}

interface FieldRowOptions {
  x: number;
  y: number;
  label: string;
  value: string;
  labelWidth?: number;
  boxWidth: number;
  boxHeight?: number;
  fonts: Fonts;
}

/** Etiqueta en negrita + caja con borde a la derecha (estilo "Cliente:" del
 * original). Devuelve la Y para la siguiente fila. */
export function drawFieldRow(page: PDFPage, opts: FieldRowOptions): number {
  const { x, y, label, value, boxWidth, fonts } = opts;
  const labelWidth = opts.labelWidth ?? 90;
  const boxHeight = opts.boxHeight ?? 20;

  page.drawText(label, { x, y: y - boxHeight / 2 - 3, size: 10.5, font: fonts.bold, color: COLORS.black });
  const boxX = x + labelWidth;
  page.drawRectangle({
    x: boxX,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: COLORS.lightGray,
    borderColor: COLORS.borderGray,
    borderWidth: 1,
  });
  page.drawText(value, {
    x: boxX + 8,
    y: y - boxHeight / 2 - 3,
    size: 10.5,
    font: fonts.regular,
    color: COLORS.black,
  });
  return y - boxHeight - 10;
}

interface SectionBarOptions {
  x: number;
  y: number;
  width: number;
  height?: number;
  text: string;
  fonts: Fonts;
  align?: "left" | "center";
  size?: number;
}

/** Barra de color sólido con texto blanco en negrita (cabeceras de sección). */
export function drawSectionBar(page: PDFPage, opts: SectionBarOptions): number {
  const height = opts.height ?? 22;
  const size = opts.size ?? 10.5;
  page.drawRectangle({ x: opts.x, y: opts.y - height, width: opts.width, height, color: COLORS.darkGreen });
  const textWidth = opts.fonts.bold.widthOfTextAtSize(opts.text, size);
  const textX = opts.align === "center" ? opts.x + (opts.width - textWidth) / 2 : opts.x + 10;
  page.drawText(opts.text, {
    x: textX,
    y: opts.y - height / 2 - size / 2 + 1,
    size,
    font: opts.fonts.bold,
    color: COLORS.white,
  });
  return opts.y - height;
}

export interface TableColumn {
  label: string;
  width: number;
  align?: "left" | "right";
}

/** Tabla de líneas (Descripción/Importe/Cantidad/Total). Devuelve la Y final. */
export function drawTable(
  page: PDFPage,
  fonts: Fonts,
  opts: { x: number; y: number; columns: TableColumn[]; rows: string[][] }
): number {
  const { x, columns, rows } = opts;
  let y = opts.y;
  const headerHeight = 24;
  const cellSize = 10;
  const lineHeight = 13;
  const vPad = 7;
  const totalWidth = columns.reduce((s, c) => s + c.width, 0);

  page.drawRectangle({ x, y: y - headerHeight, width: totalWidth, height: headerHeight, color: COLORS.darkGreen });
  let cx = x;
  for (const col of columns) {
    const size = 10;
    const tw = fonts.bold.widthOfTextAtSize(col.label, size);
    const tx = col.align === "right" ? cx + col.width - tw - 8 : cx + 8;
    page.drawText(col.label, {
      x: tx,
      y: y - headerHeight / 2 - size / 2 + 1,
      size,
      font: fonts.bold,
      color: COLORS.white,
    });
    cx += col.width;
  }
  y -= headerHeight;

  rows.forEach((row, rowIndex) => {
    // Cada celda puede envolver en varias líneas (descripciones largas); la
    // altura de la fila se ajusta a la celda con más líneas.
    const cellLines = columns.map((col, i) => wrapText(fonts.regular, cellSize, row[i] ?? "", col.width - 16));
    const rowHeight = Math.max(headerHeight, Math.max(...cellLines.map((l) => l.length)) * lineHeight + vPad * 2 - (lineHeight - cellSize));

    page.drawRectangle({
      x,
      y: y - rowHeight,
      width: totalWidth,
      height: rowHeight,
      // Filas alternas con un tinte muy sutil, para que la tabla se lea con
      // más facilidad cuando hay varias líneas (estilo factura profesional).
      color: rowIndex % 2 === 1 ? COLORS.lightGray : undefined,
      borderColor: COLORS.borderGray,
      borderWidth: 1,
    });
    cx = x;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      let ly = y - vPad - cellSize + 2;
      for (const line of cellLines[i]) {
        const tw = fonts.regular.widthOfTextAtSize(line, cellSize);
        const tx = col.align === "right" ? cx + col.width - tw - 8 : cx + 8;
        page.drawText(line, { x: tx, y: ly, size: cellSize, font: fonts.regular, color: COLORS.black });
        ly -= lineHeight;
      }
      cx += col.width;
    }
    // separadores verticales
    cx = x;
    for (const col of columns) {
      page.drawLine({
        start: { x: cx, y: y },
        end: { x: cx, y: y - rowHeight },
        thickness: 1,
        color: COLORS.borderGray,
      });
      cx += col.width;
    }
    page.drawLine({ start: { x: cx, y }, end: { x: cx, y: y - rowHeight }, thickness: 1, color: COLORS.borderGray });
    y -= rowHeight;
  });

  return y;
}

/** Caja de totales (Base imponible / IVA / Total), esquina inferior derecha. */
export function drawTotals(
  page: PDFPage,
  fonts: Fonts,
  opts: { x: number; y: number; width: number; base: number; ivaLabel: string; iva: number; total: number }
) {
  const { x, width } = opts;
  let y = opts.y;
  const rowH = 22;
  const rows: [string, string, boolean][] = [
    ["BASE IMPONIBLE", formatEUR(opts.base), false],
    [opts.ivaLabel, formatEUR(opts.iva), false],
    ["TOTAL", formatEUR(opts.total), true],
  ];
  for (const [label, value, emphasis] of rows) {
    page.drawRectangle({
      x,
      y: y - rowH,
      width,
      height: rowH,
      color: emphasis ? COLORS.darkGreen : COLORS.white,
      borderColor: COLORS.borderGray,
      borderWidth: 1,
    });
    const size = emphasis ? 11 : 10;
    page.drawText(label, {
      x: x + 10,
      y: y - rowH / 2 - size / 2 + 1,
      size,
      font: fonts.bold,
      color: emphasis ? COLORS.white : COLORS.black,
    });
    const font = emphasis ? fonts.bold : fonts.regular;
    const tw = font.widthOfTextAtSize(value, size);
    page.drawText(value, {
      x: x + width - tw - 10,
      y: y - rowH / 2 - size / 2 + 1,
      size,
      font,
      color: emphasis ? COLORS.white : COLORS.black,
    });
    y -= rowH;
  }
  return y;
}

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  cheque: "Cheque",
  tarjeta: "Otro",
  transferencia: "Transferencia",
};

/** "FORMA DE PAGO:" + casillas Efectivo/Cheque/Otro/Transferencia, con la
 * seleccionada marcada, y el número de cuenta si aplica. Devuelve la Y final. */
export function drawPaymentMethod(
  page: PDFPage,
  fonts: Fonts,
  opts: { x: number; y: number; method: string; bankAccount: string }
): number {
  let y = opts.y;
  page.drawText("FORMA DE PAGO:", { x: opts.x, y, size: 10.5, font: fonts.bold, color: COLORS.black });
  y -= 20;

  let cx = opts.x;
  for (const key of ["efectivo", "cheque", "tarjeta", "transferencia"]) {
    const checked = key === opts.method;
    page.drawRectangle({
      x: cx,
      y: y - 10,
      width: 12,
      height: 12,
      borderColor: COLORS.black,
      borderWidth: 1,
      color: checked ? COLORS.darkGreen : undefined,
    });
    const label = PAYMENT_LABELS[key];
    page.drawText(label, { x: cx + 16, y: y - 9, size: 9.5, font: fonts.regular, color: COLORS.black });
    cx += 16 + fonts.regular.widthOfTextAtSize(label, 9.5) + 18;
  }
  y -= 30;

  page.drawText("Número de cuenta:", { x: opts.x, y, size: 9.5, font: fonts.regular, color: COLORS.black });
  y -= 16;
  page.drawRectangle({ x: opts.x, y: y - 20, width: 220, height: 20, borderColor: COLORS.borderGray, borderWidth: 1 });
  if (opts.bankAccount) {
    page.drawText(opts.bankAccount, { x: opts.x + 8, y: y - 14, size: 9.5, font: fonts.regular, color: COLORS.black });
  }
  return y - 30;
}

/** Barra "OBSERVACIONES" + caja en blanco debajo para anotaciones a mano.
 * Devuelve la Y final. */
export function drawObservations(page: PDFPage, fonts: Fonts, opts: { x: number; y: number; width: number; height?: number }): number {
  const boxH = opts.height ?? 55;
  const y = drawSectionBar(page, { x: opts.x, y: opts.y, width: opts.width, text: "OBSERVACIONES", fonts, size: 10.5 });
  page.drawRectangle({ x: opts.x, y: y - boxH, width: opts.width, height: boxH, borderColor: COLORS.borderGray, borderWidth: 1 });
  return y - boxH;
}

export function drawParagraph(
  page: PDFPage,
  fonts: Fonts,
  opts: { x: number; y: number; width: number; text: string; size?: number; lineHeight?: number }
): number {
  const size = opts.size ?? 10;
  const lh = opts.lineHeight ?? size + 4;
  const lines = wrapText(fonts.regular, size, opts.text, opts.width);
  let y = opts.y;
  for (const line of lines) {
    page.drawText(line, { x: opts.x, y, size, font: fonts.regular, color: COLORS.black });
    y -= lh;
  }
  return y;
}

/** Caja con fondo sutil y borde para bloques de texto libre (descripción del
 * trabajo, detalles de un aviso...) — le da al párrafo el mismo tratamiento
 * "de documento" que el resto de bloques en vez de texto suelto. Devuelve la
 * Y final. */
export function drawContentBox(
  page: PDFPage,
  fonts: Fonts,
  opts: { x: number; y: number; width: number; text: string; size?: number; lineHeight?: number; padding?: number }
): number {
  const size = opts.size ?? 10.5;
  const lineHeight = opts.lineHeight ?? 16;
  const padding = opts.padding ?? 14;
  const innerWidth = opts.width - padding * 2;
  const lines = wrapText(fonts.regular, size, opts.text, innerWidth);
  const boxHeight = Math.max(lineHeight, lines.length * lineHeight) + padding * 2 - (lineHeight - size);

  page.drawRectangle({
    x: opts.x,
    y: opts.y - boxHeight,
    width: opts.width,
    height: boxHeight,
    color: COLORS.lightGray,
    borderColor: COLORS.borderGray,
    borderWidth: 1,
  });
  drawParagraph(page, fonts, {
    x: opts.x + padding,
    y: opts.y - padding - size + 2,
    width: innerWidth,
    text: opts.text,
    size,
    lineHeight,
  });
  return opts.y - boxHeight;
}
