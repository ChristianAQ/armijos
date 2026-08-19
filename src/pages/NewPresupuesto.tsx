import { useEffect, useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { PageContainer } from "../components/layout/PageContainer";
import { InvoiceForm } from "../components/document/InvoiceForm";
import { getBusinessSettings } from "../services/settings.service";

export function NewPresupuesto() {
  const [bankAccount, setBankAccount] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getBusinessSettings().then((settings) => {
      setBankAccount(settings.bankAccount);
      setReady(true);
    });
  }, []);

  return (
    <div>
      <TopBar title="Nuevo presupuesto" />
      <PageContainer>{ready && <InvoiceForm type="presupuesto" defaultBankAccount={bankAccount} />}</PageContainer>
    </div>
  );
}
