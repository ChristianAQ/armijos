import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import { TopBar } from "../components/layout/TopBar";
import { PageContainer } from "../components/layout/PageContainer";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { DesignPicker } from "../components/document/DesignPicker";
import { useToast } from "../context/ToastContext";
import { listTemplates } from "../services/templates.service";
import { saveDocument, getLastFacturaNumber } from "../services/documents.service";
import { buildFacturaPdf } from "../pdf/factura";
import { formatEUR } from "../pdf/layout";
import { computeTotals } from "../lib/totals";
import { lastBusinessDayOfMonth } from "../lib/format";
import { suggestNextNumber } from "../lib/nextNumber";
import { friendlyError } from "../lib/errors";
import type { FacturaData, FacturaTemplate, PdfDesign } from "../types";

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  cheque: "Cheque",
  tarjeta: "Otro",
  transferencia: "Transferencia",
};

export function GenerateFactura() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { show } = useToast();

  const [template, setTemplate] = useState<FacturaTemplate | undefined>((location.state as { template?: FacturaTemplate } | null)?.template);
  const [loading, setLoading] = useState(!template);
  const [number, setNumber] = useState("");
  const [date, setDate] = useState(lastBusinessDayOfMonth());
  const [design, setDesign] = useState<PdfDesign>(template?.design ?? "clasico");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getLastFacturaNumber().then((last) => setNumber(suggestNextNumber(last)));
  }, []);

  useEffect(() => {
    if (template || !id) return;
    listTemplates().then((all) => {
      const found = all.find((t) => t.id === id);
      setTemplate(found);
      if (found) setDesign(found.design);
      setLoading(false);
    });
  }, [id, template]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!template) return;
    setSubmitting(true);
    try {
      const data: FacturaData = {
        type: "factura",
        number: number.trim(),
        date,
        design,
        clientId: template.clientId,
        clientSnapshot: template.clientSnapshot,
        items: template.items,
        applyIva: template.applyIva,
        paymentMethod: template.paymentMethod,
        bankAccount: template.bankAccount,
      };
      const bytes = await buildFacturaPdf(data);
      const filename = `Factura ${data.number || "sin numero"} - ${template.clientSnapshot.name || "cliente"}.pdf`;
      await saveDocument(data);
      navigate("/documento-listo", { state: { bytes, filename } });
    } catch (err) {
      show(friendlyError(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  const totals = template ? computeTotals(template.items, template.applyIva) : null;

  return (
    <div>
      <TopBar
        title="Nueva factura"
        right={
          template && (
            <button
              onClick={() => navigate(`/plantillas/${template.id}`, { state: { template } })}
              className="flex h-10 w-10 items-center justify-center rounded-full text-brand-dark hover:bg-neutral-100"
              aria-label="Editar factura recurrente"
            >
              <Pencil size={19} />
            </button>
          )
        }
      />
      <PageContainer>
        {loading && <p className="text-sm text-neutral-500">Cargando…</p>}
        {!loading && !template && <p className="text-sm text-neutral-500">Esta factura recurrente ya no existe.</p>}
        {!loading && template && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input label="Nº factura" value={number} onChange={(e) => setNumber(e.target.value)} />
            <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <DesignPicker value={design} onChange={setDesign} />

            <Card className="flex flex-col gap-3 text-sm">
              <div>
                <p className="font-semibold text-neutral-900">{template.clientSnapshot.name || "Sin cliente"}</p>
                {template.clientSnapshot.cif && <p className="text-neutral-500">{template.clientSnapshot.cif}</p>}
                {template.clientSnapshot.address && <p className="text-neutral-500">{template.clientSnapshot.address}</p>}
              </div>

              <div className="flex flex-col gap-1 border-t border-neutral-200 pt-3">
                {template.items.map((item, i) => (
                  <div key={i} className="flex justify-between gap-3 text-neutral-700">
                    <span className="min-w-0 flex-1 truncate">{item.description || "Línea sin descripción"}</span>
                    <span className="shrink-0 text-neutral-500">
                      {item.quantity} × {formatEUR(item.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {totals && (
                <div className="flex justify-between border-t border-neutral-200 pt-3 font-semibold text-neutral-900">
                  <span>Total{template.applyIva ? " (IVA incl.)" : ""}</span>
                  <span>{formatEUR(totals.total)}</span>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-3 text-neutral-500">
                {PAYMENT_LABELS[template.paymentMethod]}
                {template.paymentMethod === "transferencia" && template.bankAccount ? ` · ${template.bankAccount}` : ""}
              </div>
            </Card>

            <p className="text-center text-xs text-neutral-400">
              Para cambiar el cliente, las líneas u otros datos, usa el lápiz de arriba.
            </p>

            <Button type="submit" size="lg" loading={submitting}>
              Generar PDF
            </Button>
          </form>
        )}
      </PageContainer>
    </div>
  );
}
