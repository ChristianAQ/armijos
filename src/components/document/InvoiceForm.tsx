import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";
import { Button } from "../ui/Button";
import { ClientPicker } from "./ClientPicker";
import { ItemsTable } from "./ItemsTable";
import { useClients } from "../../hooks/useClients";
import { useToast } from "../../context/ToastContext";
import { upsertClient } from "../../services/clients.service";
import { saveDocument } from "../../services/documents.service";
import { createTemplate } from "../../services/templates.service";
import { buildFacturaPdf } from "../../pdf/factura";
import { buildPresupuestoPdf } from "../../pdf/presupuesto";
import { computeTotals } from "../../lib/totals";
import { formatEUR } from "../../pdf/layout";
import { todayIso } from "../../lib/format";
import { friendlyError } from "../../lib/errors";
import type { FacturaData, LineItem, PaymentMethod, PresupuestoData } from "../../types";

interface Props {
  type: "factura" | "presupuesto";
  suggestedNumber?: string;
  defaultBankAccount: string;
}

const WORK_DESCRIPTION_PRESETS = [
  {
    label: "Desbroce",
    text: "Desbroce de vegetación espontánea, malas hierbas y matorrales en la totalidad del terreno mediante desbrozadora profesional. El servicio incluye el segado a ras de suelo, la retirada de los restos vegetales de mayor porte y su posterior gestión y transporte a un punto limpio autorizado, dejando la superficie completamente limpia, despejada y en condiciones óptimas.",
  },
  {
    label: "Mantenimiento y riego",
    text: "Mantenimiento integral de zonas ajardinadas: siega periódica de césped, poda de formación de setos y arbustos, escarda y eliminación de malas hierbas, y revisión y ajuste del sistema de riego. El servicio se presta con la periodicidad acordada, garantizando en todo momento un aspecto cuidado y saludable de las zonas verdes.",
  },
  {
    label: "Poda",
    text: "Poda de formación, mantenimiento y saneamiento de árboles y arbustos, eliminando ramas secas, dañadas o mal orientadas para favorecer su desarrollo, floración y seguridad. Incluye la trituración de los restos, la limpieza de la zona de trabajo y el transporte de los residuos a un punto limpio autorizado.",
  },
  {
    label: "Diseño y plantación",
    text: "Diseño y creación de nuevas zonas ajardinadas: preparación y nivelación del terreno, aporte de tierra vegetal y sustrato adecuado, y plantación de las especies seleccionadas (césped, arbustos, plantas de temporada o árboles). Incluye el primer riego de arraigo y recomendaciones de mantenimiento posterior.",
  },
  {
    label: "Riego automático",
    text: "Instalación, revisión o reparación de sistema de riego automático: programador, electroválvulas, tubería, aspersores y difusores. Incluye la sectorización según las necesidades hídricas de cada zona, la programación de los tiempos de riego y la comprobación final del correcto funcionamiento de toda la instalación.",
  },
  {
    label: "Limpieza general",
    text: "Limpieza y mantenimiento integral de zonas comunes ajardinadas: recogida de hojas, ramas y residuos vegetales, barrido de caminos y superficies pavimentadas, y retirada de los restos a un punto limpio autorizado, dejando las instalaciones en perfecto estado de uso.",
  },
];

export function InvoiceForm({ type, suggestedNumber, defaultBankAccount }: Props) {
  const navigate = useNavigate();
  const { show } = useToast();
  const { clients, setClients } = useClients();

  const [number, setNumber] = useState(suggestedNumber ?? "");
  const [date, setDate] = useState(todayIso());
  const [client, setClient] = useState({ name: "", cif: "", address: "" });
  const [workDescription, setWorkDescription] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", unitPrice: 0, quantity: 1 }]);
  const [applyIva, setApplyIva] = useState(type === "factura");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transferencia");
  const [bankAccount, setBankAccount] = useState(defaultBankAccount);
  const [submitting, setSubmitting] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSubmitting, setTemplateSubmitting] = useState(false);

  const totals = computeTotals(items, applyIva);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Ningún campo es obligatorio: un cliente sin nombre no se guarda en
      // la lista de clientes (para no dejar fichas vacías), pero el PDF se
      // genera igual con lo que haya.
      const clientId = client.name.trim() ? await upsertClient(client, clients) : null;
      if (clientId) {
        setClients((prev) => {
          const exists = prev.some((c) => c.id === clientId);
          return exists ? prev : [...prev, { id: clientId, ...client, createdAt: Date.now(), updatedAt: Date.now() }];
        });
      }

      const base = {
        date,
        clientId,
        clientSnapshot: client,
        items,
        applyIva,
        paymentMethod,
        bankAccount: paymentMethod === "transferencia" ? bankAccount : "",
      };

      let bytes: Uint8Array;
      let filename: string;
      let data: FacturaData | PresupuestoData;
      const clientLabel = client.name.trim() || "cliente";

      if (type === "factura") {
        data = { type: "factura", number: number.trim(), ...base };
        filename = `Factura ${data.number || "sin numero"} - ${clientLabel}.pdf`;
        bytes = await buildFacturaPdf(data);
      } else {
        data = { type: "presupuesto", workDescription, ...base };
        filename = `Presupuesto - ${clientLabel}.pdf`;
        bytes = await buildPresupuestoPdf(data);
      }

      await saveDocument(data);
      navigate("/documento-listo", { state: { bytes, filename } });
    } catch (err) {
      show(friendlyError(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveTemplate() {
    setTemplateSubmitting(true);
    try {
      const clientId = client.name.trim() ? await upsertClient(client, clients) : null;
      if (clientId) {
        setClients((prev) => {
          const exists = prev.some((c) => c.id === clientId);
          return exists ? prev : [...prev, { id: clientId, ...client, createdAt: Date.now(), updatedAt: Date.now() }];
        });
      }
      await createTemplate({
        name: templateName.trim() || client.name.trim() || "Factura recurrente sin nombre",
        clientId,
        clientSnapshot: client,
        items,
        applyIva,
        paymentMethod,
        bankAccount: paymentMethod === "transferencia" ? bankAccount : "",
      });
      show("Factura recurrente guardada", "success");
      setSavingTemplate(false);
      setTemplateName("");
    } catch (err) {
      show(friendlyError(err), "error");
    } finally {
      setTemplateSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex gap-3">
        {type === "factura" && (
          <Input label="Nº factura" value={number} onChange={(e) => setNumber(e.target.value)} className="w-28" />
        )}
        <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1" />
      </div>

      <ClientPicker clients={clients} value={client} onChange={setClient} />

      {type === "presupuesto" && (
        <div>
          <span className="mb-2 block text-sm font-medium text-neutral-700">Descripción del trabajo a realizar</span>
          <div className="mb-2 flex flex-wrap gap-2">
            {WORK_DESCRIPTION_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setWorkDescription(preset.text)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  workDescription === preset.text ? "border-brand-dark bg-brand-dark text-white" : "border-neutral-300 text-neutral-700"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <Textarea
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            placeholder="Elige una opción arriba o escribe tu propia descripción..."
            rows={3}
          />
        </div>
      )}

      <div>
        <span className="mb-2 block text-sm font-medium text-neutral-700">Líneas</span>
        <ItemsTable items={items} onChange={setItems} />
      </div>

      <Toggle label="Aplicar IVA 21 %" checked={applyIva} onChange={setApplyIva} />

      <div className="rounded-xl bg-neutral-100 p-3 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>Base imponible</span>
          <span>{formatEUR(totals.base)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>IVA 21 %</span>
          <span>{formatEUR(totals.iva)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-neutral-300 pt-1 font-semibold text-neutral-900">
          <span>Total</span>
          <span>{formatEUR(totals.total)}</span>
        </div>
      </div>

      <Select label="Forma de pago" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
        <option value="transferencia">Transferencia</option>
        <option value="efectivo">Efectivo</option>
        <option value="cheque">Cheque</option>
        <option value="tarjeta">Tarjeta</option>
      </Select>

      {paymentMethod === "transferencia" && (
        <Input label="Número de cuenta" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="ES00 0000 0000 0000 0000 0000" />
      )}

      {type === "factura" &&
        (savingTemplate ? (
          <div className="flex gap-2">
            <Input
              label="Nombre de la factura recurrente"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={client.name.trim() || "Nombre de la factura recurrente"}
              className="flex-1"
              autoFocus
            />
            <Button type="button" variant="secondary" onClick={handleSaveTemplate} loading={templateSubmitting} className="self-end">
              Guardar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSavingTemplate(false)} className="self-end">
              Cancelar
            </Button>
          </div>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setSavingTemplate(true)}>
            Guardar como factura recurrente
          </Button>
        ))}

      <Button type="submit" size="lg" loading={submitting}>
        Generar PDF
      </Button>
    </form>
  );
}
