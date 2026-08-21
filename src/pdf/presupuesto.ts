import { PDFDocument, StandardFonts, type PDFImage, type PDFPage } from "pdf-lib";
import { PAGE, COLORS } from "./theme";
import {
  drawHeader,
  drawTwoColumnInfo,
  drawTable,
  drawTotals,
  drawPaymentMethod,
  drawObservations,
  drawSectionBar,
  drawContentBox,
  drawDivider,
  formatEUR,
  formatDateEs,
  type Fonts,
} from "./layout";
import {
  drawModernoHeader,
  drawModernoDivider,
  drawModernoInfoBoxes,
  drawModernoContentSection,
  drawModernoTable,
  drawModernoTotals,
  drawModernoPaymentMethod,
  drawModernoObservations,
} from "./layoutModerno";
import { embedLogo } from "./logo";
import { getBusinessSettings } from "../services/settings.service";
import { computeTotals } from "../lib/totals";
import type { BusinessSettings, PresupuestoData } from "../types";

export async function buildPresupuestoPdf(data: PresupuestoData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Presupuesto — ${data.clientSnapshot.name}`);
  const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
  const fonts: Fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };
  const logoImage = await embedLogo(pdfDoc);
  const business = await getBusinessSettings();

  if (data.design === "moderno") {
    buildPresupuestoModerno(page, fonts, logoImage, business, data);
  } else {
    buildPresupuestoClasico(page, fonts, logoImage, business, data);
  }

  return pdfDoc.save();
}

function buildPresupuestoClasico(page: PDFPage, fonts: Fonts, logoImage: PDFImage, business: BusinessSettings, data: PresupuestoData): void {
  let y = drawHeader(page, fonts, logoImage, business, ["PRESUPUESTO"], { compact: true });
  const contentWidth = PAGE.width - PAGE.margin * 2;
  y = drawDivider(page, { x: PAGE.margin, y, width: contentWidth });

  const fechaLabel = `Fecha  ${formatDateEs(data.date)}`;
  const fw = fonts.bold.widthOfTextAtSize(fechaLabel, 11);
  page.drawText(fechaLabel, { x: PAGE.width - PAGE.margin - fw, y, size: 11, font: fonts.bold, color: COLORS.black });
  y -= 26;

  y = drawTwoColumnInfo(page, {
    x: PAGE.margin,
    y,
    width: contentWidth,
    leftHeading: "DATOS DE LA EMPRESA",
    leftLines: [
      { text: business.name, color: COLORS.black },
      { text: `${business.owner} · DNI ${business.dni}`, color: COLORS.black },
      { text: `${business.phone} · ${business.email}`, color: COLORS.gray },
      { text: business.address.replace(/\n/g, " ").replace(/,$/, ""), color: COLORS.gray },
    ],
    rightHeading: "DATOS DEL CLIENTE",
    rightLines: [
      { text: `Cliente: ${data.clientSnapshot.name}`, color: COLORS.black },
      { text: `C.I.F: ${data.clientSnapshot.cif}`, color: COLORS.gray },
      { text: `Dirección: ${data.clientSnapshot.address}`, color: COLORS.gray },
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
  const terms = business.termsText.split("\n");
  for (const line of terms) {
    page.drawText(line, { x: PAGE.margin, y, size: 8, font: fonts.regular, color: COLORS.gray });
    y -= 11;
  }
}

function buildPresupuestoModerno(page: PDFPage, fonts: Fonts, logoImage: PDFImage, business: BusinessSettings, data: PresupuestoData): void {
  const contentWidth = PAGE.width - PAGE.margin * 2;

  let y = drawModernoHeader(page, fonts, logoImage, {
    title: "PRESUPUESTO",
    dateLabel: `Fecha de emisión: ${formatDateEs(data.date)}`,
  });
  y = drawModernoDivider(page, { x: PAGE.margin, y, width: contentWidth });

  y = drawModernoInfoBoxes(page, {
    x: PAGE.margin,
    y,
    width: contentWidth,
    leftHeading: "DATOS DE LA EMPRESA",
    leftLines: [
      { text: business.name, color: COLORS.black },
      { text: business.owner, color: COLORS.black },
      { text: `NIF / CIF: ${business.dni}`, color: COLORS.gray },
      { text: business.address.split("\n").join(" · ").replace(/,\s*·/g, " ·"), color: COLORS.gray },
      { text: `${business.phone} · ${business.email}`, color: COLORS.gray },
    ],
    rightHeading: "DATOS DEL CLIENTE",
    rightLines: [
      { text: data.clientSnapshot.name || "Sin cliente", color: COLORS.black },
      { text: `NIF / CIF: ${data.clientSnapshot.cif}`, color: COLORS.gray },
      { text: data.clientSnapshot.address, color: COLORS.gray },
    ],
    fonts,
  });

  if (data.workDescription.trim()) {
    y = drawModernoContentSection(page, fonts, {
      x: PAGE.margin,
      y,
      width: contentWidth,
      heading: "DESCRIPCIÓN DEL TRABAJO A REALIZAR",
      text: data.workDescription,
      size: 10,
      lineHeight: 15,
    });
    y -= 22;
  }

  const descW = contentWidth - 85 - 65 - 85;
  const rows = data.items.map((it) => [
    it.description,
    formatEUR(it.unitPrice),
    String(it.quantity),
    formatEUR(it.unitPrice * it.quantity),
  ]);
  y = drawModernoTable(page, fonts, {
    x: PAGE.margin,
    y,
    columns: [
      { label: "DESCRIPCIÓN", width: descW, align: "left" },
      { label: "PRECIO", width: 85, align: "right" },
      { label: "CANT.", width: 65, align: "right" },
      { label: "IMPORTE", width: 85, align: "right" },
    ],
    rows,
  });

  if (!data.applyIva) {
    y -= 8;
    page.drawText("PRESUPUESTO, PRECIO SIN IVA.", { x: PAGE.margin, y, size: 9, font: fonts.regular, color: COLORS.gray });
    y -= 8;
  }
  y -= 6;

  const { base, iva, total } = computeTotals(data.items, data.applyIva);
  y = drawModernoTotals(page, fonts, {
    x: PAGE.margin,
    y,
    width: contentWidth,
    base,
    ivaLabel: "IVA 21 %",
    iva,
    total,
  });

  y = drawModernoPaymentMethod(page, fonts, { x: PAGE.margin, y, method: data.paymentMethod, bankAccount: data.bankAccount });
  y -= 10;
  y = drawModernoObservations(page, fonts, { x: PAGE.margin, y, width: contentWidth });

  y -= 22;
  const terms = business.termsText.split("\n");
  for (const line of terms) {
    page.drawText(line, { x: PAGE.margin, y, size: 8, font: fonts.regular, color: COLORS.gray });
    y -= 11;
  }
}
