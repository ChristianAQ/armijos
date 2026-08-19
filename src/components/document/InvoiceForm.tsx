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

  const validItems = items.filter((it) => it.description.trim() && it.unitPrice > 0);
  const totals = computeTotals(validItems.length ? validItems : items, applyIva);
  const canSubmit = client.name.trim().length > 0 && validItems.length > 0 && (type !== "factura" || number.trim().length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const clientId = await upsertClient(client, clients);
      setClients((prev) => {
        const exists = prev.some((c) => c.id === clientId);
        return exists ? prev : [...prev, { id: clientId, ...client, createdAt: Date.now(), updatedAt: Date.now() }];
      });

      const base = {
        date,
        clientId,
        clientSnapshot: client,
        items: validItems,
        applyIva,
        paymentMethod,
        bankAccount: paymentMethod === "transferencia" ? bankAccount : "",
      };

      let bytes: Uint8Array;
      let filename: string;
      let data: FacturaData | PresupuestoData;

      if (type === "factura") {
        data = { type: "factura", number: number.trim(), ...base };
        bytes = await buildFacturaPdf(data);
        filename = `Factura ${data.number} - ${client.name}.pdf`;
      } else {
        data = { type: "presupuesto", workDescription, ...base };
        bytes = await buildPresupuestoPdf(data);
        filename = `Presupuesto - ${client.name}.pdf`;
      }

      await saveDocument(data);
      navigate("/documento-listo", { state: { bytes, filename } });
    } catch (err) {
      show(friendlyError(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex gap-3">
        {type === "factura" && (
          <Input label="Nº factura" value={number} onChange={(e) => setNumber(e.target.value)} className="w-28" required />
        )}
        <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1" required />
      </div>

      <ClientPicker clients={clients} value={client} onChange={setClient} />

      {type === "presupuesto" && (
        <Textarea
          label="Descripción del trabajo a realizar"
          value={workDescription}
          onChange={(e) => setWorkDescription(e.target.value)}
          placeholder="Ej. Desbroce de vegetación espontánea, malas hierbas y matorrales..."
          rows={3}
        />
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

      <Button type="submit" size="lg" loading={submitting} disabled={!canSubmit}>
        Generar PDF
      </Button>
    </form>
  );
}
