import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { TopBar } from "../components/layout/TopBar";
import { PageContainer } from "../components/layout/PageContainer";
import { InvoiceForm } from "../components/document/InvoiceForm";
import { getLastFacturaNumber } from "../services/documents.service";
import { getBusinessSettings } from "../services/settings.service";
import { suggestNextNumber } from "../lib/nextNumber";
import type { FacturaTemplate } from "../types";

export function NewFactura() {
  const location = useLocation();
  const template = (location.state as { template?: FacturaTemplate } | null)?.template;
  const [suggestedNumber, setSuggestedNumber] = useState<string>();
  const [bankAccount, setBankAccount] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([getLastFacturaNumber(), getBusinessSettings()]).then(([last, settings]) => {
      setSuggestedNumber(suggestNextNumber(last));
      setBankAccount(template?.bankAccount || settings.bankAccount);
      setReady(true);
    });
  }, [template]);

  const initialData = template
    ? {
        client: template.clientSnapshot,
        items: template.items,
        applyIva: template.applyIva,
        paymentMethod: template.paymentMethod,
        bankAccount: template.bankAccount,
      }
    : undefined;

  return (
    <div>
      <TopBar title="Nueva factura" />
      <PageContainer>
        {ready && (
          <InvoiceForm type="factura" suggestedNumber={suggestedNumber} defaultBankAccount={bankAccount} initialData={initialData} />
        )}
      </PageContainer>
    </div>
  );
}
