import type { PDFFont, PDFPage } from "pdf-lib";
import { COLORS, PAGE } from "./theme";
import { drawLogo } from "./logo";
import { BUSINESS } from "../config/business";

export interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

const HEADER_HEIGHT = 100;
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

/** Dibuja la banda diagonal superior con el nombre del negocio y, opcionalmente,
 * una etiqueta (p.ej. ["FACTURA", "32"]) dentro de la cuña de color. Devuelve
 * la coordenada Y (sistema de páginas, origen abajo) donde empieza el
 * contenido libre. */
export function drawHeader(page: PDFPage, fonts: Fonts, labelLines: string[] = []): number {
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

  if (labelLines.length) {
    let ly = top - 38;
    for (const line of labelLines) {
      const size = line.length > 3 ? 18 : 22;
      const w = fonts.bold.widthOfTextAtSize(line, size);
      page.drawText(line, { x: W - 34 - w, y: ly, size, font: fonts.bold, color: COLORS.white });
      ly -= size + 4;
    }
  }

  // Bloque de datos del emisor, a la izquierda de la cuña
  let y = top - 26;
  page.drawText(BUSINESS.name, { x: PAGE.margin, y, size: 15, font: fonts.bold, color: COLORS.black });
  y -= 18;
  const smallLines = [
    `${BUSINESS.owner} con DNI ${BUSINESS.dni}`,
    BUSINESS.email,
    BUSINESS.phone,
    ...BUSINESS.addressLines,
  ];
  for (const line of smallLines) {
    const isContact = line === BUSINESS.email || line === BUSINESS.phone;
    page.drawText(line, {
      x: PAGE.margin,
      y,
      size: 9.5,
      font: fonts.regular,
      color: isContact ? COLORS.navy : COLORS.black,
    });
    y -= 13;
  }

  return top - H - 14;
}

export function drawFooter(page: PDFPage, fonts: Fonts) {
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

  drawLogo(page, fonts.bold, 26, barTop + 18);
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

  for (const row of rows) {
    // Cada celda puede envolver en varias líneas (descripciones largas); la
    // altura de la fila se ajusta a la celda con más líneas.
    const cellLines = columns.map((col, i) => wrapText(fonts.regular, cellSize, row[i] ?? "", col.width - 16));
    const rowHeight = Math.max(headerHeight, Math.max(...cellLines.map((l) => l.length)) * lineHeight + vPad * 2 - (lineHeight - cellSize));

    page.drawRectangle({
      x,
      y: y - rowHeight,
      width: totalWidth,
      height: rowHeight,
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
  }

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
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

/** "FORMA DE PAGO:" + casillas Efectivo/Cheque/Tarjeta/Transferencia, con la
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

/** Tabla RESPONSABLE / CLIENTE con casillas de firma en blanco. Devuelve la Y final. */
export function drawSignatureTable(page: PDFPage, fonts: Fonts, opts: { x: number; y: number; width: number }): number {
  const half = opts.width / 2;
  const headerH = 22;
  const boxH = 55;
  let y = opts.y;

  page.drawRectangle({ x: opts.x, y: y - headerH, width: half, height: headerH, color: COLORS.darkGreen });
  page.drawRectangle({ x: opts.x + half, y: y - headerH, width: half, height: headerH, color: COLORS.darkGreen });
  for (const [label, offset] of [["RESPONSABLE", 0], ["CLIENTE", half]] as [string, number][]) {
    const size = 10.5;
    const tw = fonts.bold.widthOfTextAtSize(label, size);
    page.drawText(label, {
      x: opts.x + offset + (half - tw) / 2,
      y: y - headerH / 2 - size / 2 + 1,
      size,
      font: fonts.bold,
      color: COLORS.white,
    });
  }
  y -= headerH;
  page.drawRectangle({ x: opts.x, y: y - boxH, width: opts.width, height: boxH, borderColor: COLORS.borderGray, borderWidth: 1 });
  page.drawLine({ start: { x: opts.x + half, y }, end: { x: opts.x + half, y: y - boxH }, thickness: 1, color: COLORS.borderGray });
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
