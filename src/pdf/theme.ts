import { rgb } from "pdf-lib";

// Colores de marca reales, extraídos de las plantillas originales en PDF
// (operadores de color `rg` leídos directamente del content stream).
export const COLORS = {
  darkGreen: rgb(0x12 / 255, 0x35 / 255, 0x2b / 255), // #12352b — barras, tabla, cajas
  green: rgb(0x00 / 255, 0x9c / 255, 0x42 / 255), // #009c42 — banda diagonal de acento
  deepGreen: rgb(0x07 / 255, 0x52 / 255, 0x2e / 255), // #07522e — detalle
  navy: rgb(0x00 / 255, 0x23 / 255, 0x4c / 255), // #00234c — labels, email/teléfono
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
  gray: rgb(0.45, 0.45, 0.45),
  borderGray: rgb(0.75, 0.75, 0.75),
};

export const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 40,
};
