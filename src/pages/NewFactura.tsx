import { useEffect, useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { PageContainer } from "../components/layout/PageContainer";
import { InvoiceForm } from "../components/document/InvoiceForm";
import { getLastFacturaNumber } from "../services/documents.service";
import { getBusinessSettings } from "../services/settings.service";
import { suggestNextNumber } from "../lib/nextNumber";

export function NewFactura() {
  const [suggestedNumber, setSuggestedNumber] = useState<string>();
  const [bankAccount, setBankAccount] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([getLastFacturaNumber(), getBusinessSettings()]).then(([last, settings]) => {
      setSuggestedNumber(suggestNextNumber(last));
      setBankAccount(settings.bankAccount);
      setReady(true);
    });
  }, []);

  return (
    <div>
      <TopBar title="Nueva factura" />
      <PageContainer>{ready && <InvoiceForm type="factura" suggestedNumber={suggestedNumber} defaultBankAccount={bankAccount} />}</PageContainer>
    </div>
  );
}
