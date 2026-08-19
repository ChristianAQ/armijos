import { PDFDocument, StandardFonts } from "pdf-lib";
import { PAGE, COLORS } from "./theme";
import {
  drawHeader,
  drawFooter,
  drawFieldRow,
  drawTable,
  drawTotals,
  drawPaymentMethod,
  drawSignatureTable,
  formatEUR,
  formatDateEs,
} from "./layout";
import { BUSINESS } from "../config/business";
import { computeTotals } from "../lib/totals";
import type { FacturaData } from "../types";

export async function buildFacturaPdf(data: FacturaData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Factura ${data.number} — ${data.clientSnapshot.name}`);
  const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };

  let y = drawHeader(page, fonts, ["FACTURA", data.number]);

  const fechaLabel = `Fecha  ${formatDateEs(data.date)}`;
  const fw = fonts.bold.widthOfTextAtSize(fechaLabel, 11);
  page.drawText(fechaLabel, { x: PAGE.width - PAGE.margin - fw, y, size: 11, font: fonts.bold, color: COLORS.black });
  y -= 24;

  const fieldBoxWidth = PAGE.width - PAGE.margin * 2 - 90;
  y = drawFieldRow(page, { x: PAGE.margin, y, label: "Cliente:", value: data.clientSnapshot.name, boxWidth: fieldBoxWidth, fonts });
  y = drawFieldRow(page, { x: PAGE.margin, y, label: "C.I.F :", value: data.clientSnapshot.cif, boxWidth: fieldBoxWidth, fonts });
  y = drawFieldRow(page, { x: PAGE.margin, y, label: "Dirección:", value: data.clientSnapshot.address, boxWidth: fieldBoxWidth, fonts });
  y -= 14;

  const tableWidth = PAGE.width - PAGE.margin * 2;
  const descW = tableWidth - 90 - 70 - 90;
  const rows = data.items.map((it) => [
    it.description,
    formatEUR(it.unitPrice),
    String(it.quantity),
    formatEUR(it.unitPrice * it.quantity),
  ]);
  y = drawTable(page, fonts, {
    x: PAGE.margin,
    y,
    columns: [
      { label: "DESCRIPCIÒN", width: descW, align: "left" },
      { label: "IMPORTE", width: 90, align: "right" },
      { label: "CANTIDAD", width: 70, align: "right" },
      { label: "TOTAL", width: 90, align: "right" },
    ],
    rows,
  });
  y -= 20;

  const { base, iva, total } = computeTotals(data.items, data.applyIva);

  const totalsWidth = 220;
  const totalsX = PAGE.width - PAGE.margin - totalsWidth;
  const totalsBottomY = drawTotals(page, fonts, {
    x: totalsX,
    y,
    width: totalsWidth,
    base,
    ivaLabel: "IVA 21 %",
    iva,
    total,
  });

  const paymentBottomY = drawPaymentMethod(page, fonts, {
    x: PAGE.margin,
    y,
    method: data.paymentMethod,
    bankAccount: data.bankAccount,
  });

  y = Math.min(totalsBottomY, paymentBottomY) - 20;
  y = drawSignatureTable(page, fonts, { x: PAGE.margin, y, width: tableWidth });

  y -= 22;
  const terms = BUSINESS.termsText.split("\n");
  for (const line of terms) {
    page.drawText(line, { x: PAGE.margin, y, size: 8, font: fonts.regular, color: COLORS.gray });
    y -= 11;
  }

  drawFooter(page, fonts);

  return pdfDoc.save();
}
