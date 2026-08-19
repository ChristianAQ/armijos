import { useEffect, useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { PageContainer } from "../components/layout/PageContainer";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { getBusinessSettings, saveBusinessSettings } from "../services/settings.service";
import { friendlyError } from "../lib/errors";

export function Settings() {
  const { show } = useToast();
  const [bankAccount, setBankAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBusinessSettings()
      .then((s) => setBankAccount(s.bankAccount))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBusinessSettings({ bankAccount });
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
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input
              label="Número de cuenta por defecto"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
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
