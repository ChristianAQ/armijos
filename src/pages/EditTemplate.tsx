import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { TopBar } from "../components/layout/TopBar";
import { PageContainer } from "../components/layout/PageContainer";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Toggle } from "../components/ui/Toggle";
import { Button } from "../components/ui/Button";
import { ClientPicker } from "../components/document/ClientPicker";
import { ItemsTable } from "../components/document/ItemsTable";
import { useClients } from "../hooks/useClients";
import { useToast } from "../context/ToastContext";
import { upsertClient } from "../services/clients.service";
import { listTemplates, updateTemplate } from "../services/templates.service";
import { friendlyError } from "../lib/errors";
import type { FacturaTemplate, LineItem, PaymentMethod } from "../types";

export function EditTemplate() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { show } = useToast();
  const { clients, setClients } = useClients();

  const [template, setTemplate] = useState<FacturaTemplate | undefined>((location.state as { template?: FacturaTemplate } | null)?.template);
  const [loading, setLoading] = useState(!template);

  const [name, setName] = useState(template?.name ?? "");
  const [client, setClient] = useState(template?.clientSnapshot ?? { name: "", cif: "", address: "" });
  const [items, setItems] = useState<LineItem[]>(template?.items ?? [{ description: "", unitPrice: 0, quantity: 1 }]);
  const [applyIva, setApplyIva] = useState(template?.applyIva ?? true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(template?.paymentMethod ?? "transferencia");
  const [bankAccount, setBankAccount] = useState(template?.bankAccount ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (template || !id) return;
    listTemplates().then((all) => {
      const found = all.find((t) => t.id === id);
      setTemplate(found);
      if (found) {
        setName(found.name);
        setClient(found.clientSnapshot);
        setItems(found.items);
        setApplyIva(found.applyIva);
        setPaymentMethod(found.paymentMethod);
        setBankAccount(found.bankAccount);
      }
      setLoading(false);
    });
  }, [id, template]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      const clientId = client.name.trim() ? await upsertClient(client, clients) : null;
      if (clientId) {
        setClients((prev) => {
          const exists = prev.some((c) => c.id === clientId);
          return exists ? prev : [...prev, { id: clientId, ...client, createdAt: Date.now(), updatedAt: Date.now() }];
        });
      }
      await updateTemplate(id, {
        name: name.trim() || client.name.trim() || "Factura recurrente sin nombre",
        clientId,
        clientSnapshot: client,
        items,
        applyIva,
        paymentMethod,
        bankAccount: paymentMethod === "transferencia" ? bankAccount : "",
      });
      show("Factura recurrente actualizada", "success");
      navigate("/plantillas");
    } catch (err) {
      show(friendlyError(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <TopBar title="Editar factura recurrente" />
      <PageContainer>
        {loading && <p className="text-sm text-neutral-500">Cargando…</p>}
        {!loading && !template && <p className="text-sm text-neutral-500">Esta factura recurrente ya no existe.</p>}
        {!loading && template && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input label="Nombre de la factura recurrente" value={name} onChange={(e) => setName(e.target.value)} />

            <ClientPicker clients={clients} value={client} onChange={setClient} />

            <div>
              <span className="mb-2 block text-sm font-medium text-neutral-700">Líneas</span>
              <ItemsTable items={items} onChange={setItems} />
            </div>

            <Toggle label="Aplicar IVA 21 %" checked={applyIva} onChange={setApplyIva} />

            <Select label="Forma de pago" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta">Tarjeta</option>
            </Select>

            {paymentMethod === "transferencia" && (
              <Input
                label="Número de cuenta"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="ES00 0000 0000 0000 0000 0000"
              />
            )}

            <Button type="submit" size="lg" loading={submitting}>
              Guardar cambios
            </Button>
          </form>
        )}
      </PageContainer>
    </div>
  );
}
