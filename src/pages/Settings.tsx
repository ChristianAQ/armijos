import { useEffect, useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { PageContainer } from "../components/layout/PageContainer";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { getBusinessSettings, saveBusinessSettings } from "../services/settings.service";
import { friendlyError } from "../lib/errors";
import type { BusinessSettings } from "../types";

const EMPTY: BusinessSettings = {
  name: "",
  owner: "",
  dni: "",
  phone: "",
  email: "",
  address: "",
  termsText: "",
  bankAccount: "",
};

export function Settings() {
  const { show } = useToast();
  const [business, setBusiness] = useState<BusinessSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBusinessSettings()
      .then(setBusiness)
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) {
    setBusiness((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBusinessSettings(business);
      show("Ajustes guardados.", "success");
    } catch (err) {
      show(friendlyError(err), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <TopBar title="Ajustes" />
      <PageContainer>
        {!loading && (
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-neutral-900">Datos de la empresa</h2>
              <p className="mb-4 text-xs text-neutral-500">
                Se rellenan una sola vez aquí y se usan en todas las facturas, presupuestos y avisos.
              </p>
              <div className="flex flex-col gap-4">
                <Input label="Nombre de la empresa" value={business.name} onChange={(e) => update("name", e.target.value)} />
                <Input label="Titular / responsable" value={business.owner} onChange={(e) => update("owner", e.target.value)} />
                <Input label="DNI / NIF" value={business.dni} onChange={(e) => update("dni", e.target.value)} />
                <Input label="Teléfono" value={business.phone} onChange={(e) => update("phone", e.target.value)} />
                <Input label="Email" type="email" value={business.email} onChange={(e) => update("email", e.target.value)} />
                <Textarea
                  label="Dirección"
                  value={business.address}
                  onChange={(e) => update("address", e.target.value)}
                  rows={2}
                  hint="Puedes usar un salto de línea para partirla en dos líneas."
                />
                <Textarea
                  label="Texto de contacto (pie de página)"
                  value={business.termsText}
                  onChange={(e) => update("termsText", e.target.value)}
                  rows={2}
                  hint="Aparece al final de facturas y presupuestos."
                />
              </div>
            </div>

            <Input
              label="Número de cuenta por defecto"
              value={business.bankAccount}
              onChange={(e) => update("bankAccount", e.target.value)}
              placeholder="ES00 0000 0000 0000 0000 0000"
              hint="Se precarga al elegir 'Transferencia' como forma de pago, y sigue siendo editable en cada documento."
            />

            <Button type="submit" loading={saving}>
              Guardar
            </Button>
          </form>
        )}
      </PageContainer>
    </div>
  );
}
