import fs from "fs";
import { buildFacturaPdf } from "../src/pdf/factura";
import { buildPresupuestoPdf } from "../src/pdf/presupuesto";
import { buildAvisoPdf } from "../src/pdf/aviso";
import type { AvisoData, FacturaData, PresupuestoData } from "../src/types";

const outDir = "scripts/out";
fs.mkdirSync(outDir, { recursive: true });

async function main() {
  const factura: FacturaData = {
    type: "factura",
    number: "33",
    date: "2026-08-19",
    clientId: null,
    clientSnapshot: { name: "COMUNIDAD ANGELILLO Nº 1", cif: "H 79813937", address: "Angelillo Nº 1" },
    items: [{ description: "Mantenimiento y conservación de zonas ajardinadas y riego", unitPrice: 170, quantity: 1 }],
    applyIva: true,
    paymentMethod: "transferencia",
    bankAccount: "",
  };

  const presupuesto: PresupuestoData = {
    type: "presupuesto",
    date: "2026-08-19",
    clientId: null,
    clientSnapshot: { name: "", cif: "", address: "CALLE DE SAN CLAUDIO 82, MADRID" },
    workDescription:
      "Desbroce de vegetación espontánea, malas hierbas y matorrales en el terreno. El servicio incluye el segado, la limpieza integral y su posterior gestión y transporte a un punto limpio autorizado, dejando la superficie completamente limpia y despejada.",
    items: [{ description: "CALLE DE SAN CLAUDIO 82, MADRID", unitPrice: 100, quantity: 1 }],
    applyIva: false,
    paymentMethod: "transferencia",
    bankAccount: "",
  };

  const aviso: AvisoData = {
    type: "aviso",
    date: "2026-03-07",
    zone: "la cancha de tenis",
    timeFrom: "09:00",
    timeTo: "11:00",
    reason: "limpieza con máquina Karcher",
    extraNote: "",
  };

  fs.writeFileSync(`${outDir}/factura.pdf`, await buildFacturaPdf(factura));
  fs.writeFileSync(`${outDir}/presupuesto.pdf`, await buildPresupuestoPdf(presupuesto));
  fs.writeFileSync(`${outDir}/aviso.pdf`, await buildAvisoPdf(aviso));
  console.log("PDFs generados en", outDir);
}

main();
