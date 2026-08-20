import { PDFDocument, StandardFonts } from "pdf-lib";
import { PAGE, COLORS } from "./theme";
import {
  drawHeader,
  drawTwoColumnFields,
  drawTable,
  drawTotals,
  drawPaymentMethod,
  drawObservations,
  drawSectionBar,
  drawContentBox,
  drawDivider,
  formatEUR,
  formatDateEs,
} from "./layout";
import { embedLogo } from "./logo";
import { BUSINESS } from "../config/business";
import { computeTotals } from "../lib/totals";
import type { PresupuestoData } from "../types";

export async function buildPresupuestoPdf(data: PresupuestoData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Presupuesto — ${data.clientSnapshot.name}`);
  const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };
  const logoImage = await embedLogo(pdfDoc);

  let y = drawHeader(page, fonts, logoImage, ["PRESUPUESTO"]);
  const contentWidth = PAGE.width - PAGE.margin * 2;
  y = drawDivider(page, { x: PAGE.margin, y, width: contentWidth });

  const fechaLabel = `Fecha  ${formatDateEs(data.date)}`;
  const fw = fonts.bold.widthOfTextAtSize(fechaLabel, 11);
  page.drawText(fechaLabel, { x: PAGE.width - PAGE.margin - fw, y, size: 11, font: fonts.bold, color: COLORS.black });
  y -= 26;

  y = drawTwoColumnFields(page, {
    x: PAGE.margin,
    y,
    width: contentWidth,
    leftHeading: "DATOS DE LA EMPRESA",
    leftRows: [
      { label: "Empresa:", value: BUSINESS.name },
      { label: "DNI :", value: BUSINESS.dni },
      { label: "Dirección:", value: BUSINESS.addressLines.join(" ").replace(/,$/, "") },
    ],
    rightHeading: "DATOS DEL CLIENTE",
    rightRows: [
      { label: "Cliente:", value: data.clientSnapshot.name },
      { label: "C.I.F :", value: data.clientSnapshot.cif },
      { label: "Dirección:", value: data.clientSnapshot.address },
    ],
    fonts,
  });
  y -= 16;

  if (data.workDescription.trim()) {
    y = drawSectionBar(page, { x: PAGE.margin, y, width: contentWidth, text: "DESCRIPCIÓN DEL TRABAJO A REALIZAR", fonts, size: 10.5 });
    y = drawContentBox(page, fonts, { x: PAGE.margin, y, width: contentWidth, text: data.workDescription, size: 10.5, lineHeight: 15 });
    y -= 16;
  }

  const descW = contentWidth - 90 - 70 - 90;
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

  if (!data.applyIva) {
    y -= 14;
    page.drawText("PRESUPUESTO, PRECIO SIN IVA.", { x: PAGE.margin, y, size: 9, font: fonts.regular, color: COLORS.gray });
  }
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
  y = drawObservations(page, fonts, { x: PAGE.margin, y, width: contentWidth });

  y -= 22;
  const terms = BUSINESS.termsText.split("\n");
  for (const line of terms) {
    page.drawText(line, { x: PAGE.margin, y, size: 8, font: fonts.regular, color: COLORS.gray });
    y -= 11;
  }

  return pdfDoc.save();
}
