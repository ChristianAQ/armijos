import { PDFDocument, StandardFonts } from "pdf-lib";
import { PAGE, COLORS } from "./theme";
import { drawHeader, drawFooter, drawSectionBar, drawContentBox, drawDivider, formatDateEs } from "./layout";
import { embedLogo } from "./logo";
import type { AvisoData } from "../types";

function buildBodyText(data: AvisoData): string {
  const zone = data.zone.trim();
  const paragraphs = [
    `Se les informa que durante el horario mencionado, ${zone} permanecerá fuera de servicio debido a labores de ${data.reason.trim()}.`,
    `Restricción: No se podrá utilizar ${zone} entre las ${data.timeFrom} y las ${data.timeTo}.`,
    `Reapertura: Una vez finalizado el trabajo (después de las ${data.timeTo}), la instalación podrá usarse con total normalidad.`,
  ];
  if (data.extraNote.trim()) paragraphs.push(data.extraNote.trim());
  paragraphs.push("Agradecemos su colaboración para mantener las áreas comunes en excelente estado.");
  return paragraphs.join("\n\n");
}

export async function buildAvisoPdf(data: AvisoData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Aviso de mantenimiento — ${data.zone}`);
  const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };
  const logoImage = await embedLogo(pdfDoc);

  let y = drawHeader(page, fonts, logoImage, []);
  const contentWidth = PAGE.width - PAGE.margin * 2;

  y = drawDivider(page, { x: PAGE.margin, y, width: contentWidth });
  y -= 6;
  const title = "AVISO DE MANTENIMIENTO";
  const titleSize = 24;
  const tw = fonts.bold.widthOfTextAtSize(title, titleSize);
  page.drawText(title, { x: PAGE.margin + (contentWidth - tw) / 2, y, size: titleSize, font: fonts.bold, color: COLORS.darkGreen });
  y -= 48;

  const dirigidoA = `DIRIGIDO A : USUARIOS DE ${data.zone.trim().toUpperCase()}`;
  page.drawText(dirigidoA, { x: PAGE.margin, y, size: 11.5, font: fonts.bold, color: COLORS.black });
  y -= 28;

  page.drawText(`FECHA :  ${formatDateEs(data.date)}`, { x: PAGE.margin, y, size: 11.5, font: fonts.bold, color: COLORS.black });
  y -= 20;
  page.drawText(`HORARIO:  DESDE ${data.timeFrom}  HASTA ${data.timeTo}`, {
    x: PAGE.margin,
    y,
    size: 11.5,
    font: fonts.bold,
    color: COLORS.black,
  });
  y -= 36;

  y = drawSectionBar(page, { x: PAGE.margin, y, width: contentWidth, text: "DETALLES DE VENTANA DE MANTENIMIENTO", fonts, size: 11.5 });
  drawContentBox(page, fonts, { x: PAGE.margin, y, width: contentWidth, text: buildBodyText(data), size: 10.5, lineHeight: 16 });

  drawFooter(page, logoImage);

  return pdfDoc.save();
}
