import type { Color, PDFImage, PDFPage } from "pdf-lib";
import { COLORS, PAGE } from "./theme";
import { wrapText, formatEUR, PAYMENT_LABELS, type Fonts, type TableColumn } from "./layout";

const LOGO_SIZE = 64;

/** Cabecera del diseño "moderno": sin cuña de color, logo a la izquierda y
 * título/fecha alineados a la derecha, con el margen superior igual al
 * lateral. Devuelve la Y donde empieza el contenido libre. */
export function drawModernoHeader(
  page: PDFPage,
  fonts: Fonts,
  logoImage: PDFImage,
  opts: { title: string; subtitleLines?: string[]; dateLabel: string }
): number {
  const top = PAGE.height;
  const logoTop = top - PAGE.margin;
  page.drawImage(logoImage, { x: PAGE.margin, y: logoTop - LOGO_SIZE, width: LOGO_SIZE, height: LOGO_SIZE });

  const titleSize = 26;
  let ty = top - PAGE.margin - titleSize + 6;
  const tw = fonts.bold.widthOfTextAtSize(opts.title, titleSize);
  page.drawText(opts.title, { x: PAGE.width - PAGE.margin - tw, y: ty, size: titleSize, font: fonts.bold, color: COLORS.darkGreen });
  ty -= titleSize * 0.55 + 4;

  for (const line of opts.subtitleLines ?? []) {
    const size = 12;
    const w = fonts.bold.widthOfTextAtSize(line, size);
    page.drawText(line, { x: PAGE.width - PAGE.margin - w, y: ty, size, font: fonts.bold, color: COLORS.darkGreen });
    ty -= size + 6;
  }

  const dateSize = 9;
  const dw = fonts.regular.widthOfTextAtSize(opts.dateLabel, dateSize);
  page.drawText(opts.dateLabel, { x: PAGE.width - PAGE.margin - dw, y: ty, size: dateSize, font: fonts.regular, color: COLORS.amber });
  ty -= dateSize;

  const bottomEdge = Math.min(logoTop - LOGO_SIZE, ty);
  return bottomEdge - 24;
}

/** Línea fina de separación bajo la cabecera. */
export function drawModernoDivider(page: PDFPage, opts: { x: number; y: number; width: number }): number {
  page.drawLine({ start: { x: opts.x, y: opts.y }, end: { x: opts.x + opts.width, y: opts.y }, thickness: 1.5, color: COLORS.darkGreen });
  return opts.y - 22;
}

export interface ModernoInfoLine {
  text: string;
  bold?: boolean;
  color?: Color;
}

interface ModernoInfoBoxesOptions {
  x: number;
  y: number;
  width: number;
  gap?: number;
  leftHeading: string;
  leftLines: ModernoInfoLine[];
  rightHeading: string;
  rightLines: ModernoInfoLine[];
  fonts: Fonts;
}

const INFO_PADDING = 14;
const INFO_LINE_SIZE = 9.5;
const INFO_LINE_HEIGHT = 14;
const INFO_HEADING_SIZE = 9.5;

function measureColumn(fonts: Fonts, lines: ModernoInfoLine[], innerWidth: number) {
  const wrapped: { text: string; line: ModernoInfoLine }[] = [];
  for (const line of lines) {
    const font = line.bold ? fonts.bold : fonts.regular;
    for (const w of wrapText(font, INFO_LINE_SIZE, line.text, innerWidth)) {
      wrapped.push({ text: w, line });
    }
  }
  const height = INFO_PADDING * 2 + INFO_HEADING_SIZE + 8 + wrapped.length * INFO_LINE_HEIGHT;
  return { wrapped, height };
}

/** Dos bloques con fondo verde muy suave (EMISOR/CLIENTE del diseño
 * original, aquí "Datos de la empresa"/"Datos del cliente"). Misma altura
 * en ambas columnas; todas las líneas de datos comparten tipografía sin
 * negrita y el mismo tamaño — solo la cabecera va en negrita. Devuelve la Y
 * final. */
export function drawModernoInfoBoxes(page: PDFPage, opts: ModernoInfoBoxesOptions): number {
  const gap = opts.gap ?? 20;
  const colWidth = (opts.width - gap) / 2;
  const innerWidth = colWidth - INFO_PADDING * 2;

  const left = measureColumn(opts.fonts, opts.leftLines, innerWidth);
  const right = measureColumn(opts.fonts, opts.rightLines, innerWidth);
  const boxHeight = Math.max(left.height, right.height);

  const draw = (x: number, heading: string, measured: ReturnType<typeof measureColumn>) => {
    page.drawRectangle({ x, y: opts.y - boxHeight, width: colWidth, height: boxHeight, color: COLORS.paleGreen });
    let ly = opts.y - INFO_PADDING - INFO_HEADING_SIZE + 1;
    page.drawText(heading, { x: x + INFO_PADDING, y: ly, size: INFO_HEADING_SIZE, font: opts.fonts.bold, color: COLORS.darkGreen });
    ly -= INFO_HEADING_SIZE + 8;
    for (const { text, line } of measured.wrapped) {
      page.drawText(text, {
        x: x + INFO_PADDING,
        y: ly,
        size: INFO_LINE_SIZE,
        font: opts.fonts.regular,
        color: line.color ?? COLORS.black,
      });
      ly -= INFO_LINE_HEIGHT;
    }
  };

  draw(opts.x, opts.leftHeading, left);
  draw(opts.x + colWidth + gap, opts.rightHeading, right);

  return opts.y - boxHeight - 24;
}

const CELL_PAD = 10;

/** Tabla de líneas del diseño moderno: cabecera en un contenedor verde muy
 * claro (misma identidad que los bloques de datos), sin bordes de
 * cuadrícula en las filas, solo separadores finos entre ellas. El importe
 * se resalta en azul. Devuelve la Y final. */
export function drawModernoTable(
  page: PDFPage,
  fonts: Fonts,
  opts: { x: number; y: number; columns: TableColumn[]; rows: string[][] }
): number {
  const { x, columns, rows } = opts;
  let y = opts.y;
  const headerSize = 9;
  const headerPadV = 9;
  const cellSize = 10;
  const lineHeight = 13;
  const rowGap = 10;
  const totalWidth = columns.reduce((s, c) => s + c.width, 0);

  const headerHeight = headerSize + headerPadV * 2;
  page.drawRectangle({ x, y: y - headerHeight, width: totalWidth, height: headerHeight, color: COLORS.paleGreen });
  let cx = x;
  for (const col of columns) {
    const tw = fonts.bold.widthOfTextAtSize(col.label, headerSize);
    const tx = col.align === "right" ? cx + col.width - tw - CELL_PAD : cx + CELL_PAD;
    page.drawText(col.label, { x: tx, y: y - headerPadV - headerSize + 1, size: headerSize, font: fonts.bold, color: COLORS.darkGreen });
    cx += col.width;
  }
  y -= headerHeight;
  page.drawLine({ start: { x, y }, end: { x: x + totalWidth, y }, thickness: 1, color: COLORS.darkGreen });
  y -= 16;

  rows.forEach((row, rowIndex) => {
    const cellLines = columns.map((col, i) => wrapText(fonts.regular, cellSize, row[i] ?? "", col.width - CELL_PAD * 2));
    const rowHeight = Math.max(lineHeight, Math.max(...cellLines.map((l) => l.length)) * lineHeight);

    cx = x;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      let ly = y - cellSize + 1;
      const color = i === columns.length - 1 ? COLORS.navy : COLORS.black;
      for (const line of cellLines[i]) {
        const tw = fonts.regular.widthOfTextAtSize(line, cellSize);
        const tx = col.align === "right" ? cx + col.width - tw - CELL_PAD : cx + CELL_PAD;
        page.drawText(line, { x: tx, y: ly, size: cellSize, font: fonts.regular, color });
        ly -= lineHeight;
      }
      cx += col.width;
    }
    y -= rowHeight + rowGap / 2;
    if (rowIndex < rows.length - 1) {
      page.drawLine({ start: { x, y }, end: { x: x + totalWidth, y }, thickness: 0.75, color: COLORS.lightGray });
    }
    y -= rowGap / 2;
  });

  return y;
}

/** Totales del diseño moderno: filas simples etiqueta/valor sin caja, con
 * una línea fina antes del TOTAL, que se destaca en verde oscuro y mayor
 * tamaño. Devuelve la Y final. */
export function drawModernoTotals(
  page: PDFPage,
  fonts: Fonts,
  opts: { x: number; y: number; width: number; base: number; ivaLabel: string; iva: number; total: number }
): number {
  const { x, width } = opts;
  let y = opts.y;
  page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 1, color: COLORS.borderGray });
  y -= 20;

  const rows: [string, string][] = [
    ["Base imponible", formatEUR(opts.base)],
    [opts.ivaLabel, formatEUR(opts.iva)],
  ];
  for (const [label, value] of rows) {
    const size = 10;
    page.drawText(label, { x, y, size, font: fonts.regular, color: COLORS.gray });
    const tw = fonts.bold.widthOfTextAtSize(value, size);
    page.drawText(value, { x: x + width - tw, y, size, font: fonts.bold, color: COLORS.black });
    y -= size + 13;
  }
  y -= 10;

  const totalSize = 15;
  const totalRowHeight = 36;
  page.drawRectangle({ x, y: y - totalRowHeight, width, height: totalRowHeight, color: COLORS.paleGreen });
  const ty = y - totalRowHeight / 2 - totalSize / 2 + 1;
  page.drawText("TOTAL", { x: x + 12, y: ty, size: totalSize, font: fonts.bold, color: COLORS.darkGreen });
  const totalValue = formatEUR(opts.total);
  const tvw = fonts.bold.widthOfTextAtSize(totalValue, totalSize);
  page.drawText(totalValue, { x: x + width - tvw - 12, y: ty, size: totalSize, font: fonts.bold, color: COLORS.darkGreen });
  return y - totalRowHeight - 16;
}

/** "FORMA DE PAGO" del diseño moderno: mismo contenido que el diseño
 * clásico (casillas + cuenta), pero sin caja alrededor del número de
 * cuenta, en línea con el resto del diseño sin bordes pesados. */
export function drawModernoPaymentMethod(
  page: PDFPage,
  fonts: Fonts,
  opts: { x: number; y: number; method: string; bankAccount: string }
): number {
  let y = opts.y;
  page.drawText("FORMA DE PAGO", { x: opts.x, y, size: 9.5, font: fonts.bold, color: COLORS.darkGreen });
  y -= 20;

  let cx = opts.x;
  for (const key of ["efectivo", "cheque", "tarjeta", "transferencia"]) {
    const checked = key === opts.method;
    page.drawRectangle({
      x: cx,
      y: y - 9,
      width: 11,
      height: 11,
      borderColor: COLORS.borderGray,
      borderWidth: 1,
      color: checked ? COLORS.darkGreen : COLORS.white,
    });
    const label = PAYMENT_LABELS[key];
    page.drawText(label, { x: cx + 15, y: y - 8, size: 9, font: fonts.regular, color: COLORS.black });
    cx += 15 + fonts.regular.widthOfTextAtSize(label, 9) + 16;
  }
  y -= 26;

  if (opts.method === "transferencia" && opts.bankAccount) {
    page.drawText(`Número de cuenta: ${opts.bankAccount}`, { x: opts.x, y, size: 9.5, font: fonts.regular, color: COLORS.gray });
    y -= 18;
  }
  return y;
}

/** Sección de texto libre del diseño moderno (p.ej. "Descripción del
 * trabajo a realizar" en presupuestos): cabecera discreta + caja con fondo
 * suave y el texto ya escrito dentro. Devuelve la Y final. */
export function drawModernoContentSection(
  page: PDFPage,
  fonts: Fonts,
  opts: { x: number; y: number; width: number; heading: string; text: string; size?: number; lineHeight?: number }
): number {
  const size = opts.size ?? 10;
  const lineHeight = opts.lineHeight ?? 15;
  const padding = 14;
  page.drawText(opts.heading, { x: opts.x, y: opts.y, size: 9.5, font: fonts.bold, color: COLORS.darkGreen });
  const boxY = opts.y - 10;
  const innerWidth = opts.width - padding * 2;
  const lines = wrapText(fonts.regular, size, opts.text, innerWidth);
  const boxHeight = Math.max(lineHeight, lines.length * lineHeight) + padding * 2 - (lineHeight - size);

  page.drawRectangle({ x: opts.x, y: boxY - boxHeight, width: opts.width, height: boxHeight, color: COLORS.paleGreen });
  let ly = boxY - padding - size + 2;
  for (const line of lines) {
    page.drawText(line, { x: opts.x + padding, y: ly, size, font: fonts.regular, color: COLORS.black });
    ly -= lineHeight;
  }
  return boxY - boxHeight;
}

/** "OBSERVACIONES" del diseño moderno: cabecera discreta + caja con borde
 * fino en blanco, sin barra de color. Devuelve la Y final. */
export function drawModernoObservations(page: PDFPage, fonts: Fonts, opts: { x: number; y: number; width: number; height?: number }): number {
  const boxH = opts.height ?? 50;
  page.drawText("OBSERVACIONES", { x: opts.x, y: opts.y, size: 9.5, font: fonts.bold, color: COLORS.darkGreen });
  const boxY = opts.y - 10;
  page.drawRectangle({ x: opts.x, y: boxY - boxH, width: opts.width, height: boxH, borderColor: COLORS.borderGray, borderWidth: 1 });
  return boxY - boxH;
}
