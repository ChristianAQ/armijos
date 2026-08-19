import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { CheckCircle2, Share2, Download } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { downloadPdf, sharePdf } from "../pdf/share";
import { useToast } from "../context/ToastContext";

interface LocationState {
  bytes: Uint8Array;
  filename: string;
}

export function DocumentReady() {
  const location = useLocation();
  const navigate = useNavigate();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const state = location.state as LocationState | null;

  if (!state) {
    navigate("/", { replace: true });
    return null;
  }

  async function handleShare() {
    setBusy(true);
    try {
      const result = await sharePdf(state!.bytes, state!.filename);
      if (result === "downloaded") show("PDF descargado.", "success");
    } catch {
      show("No se pudo compartir el PDF.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <PageContainer>
        <div className="flex flex-col items-center gap-4 pt-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-dark/10 text-brand-dark">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">PDF generado</h1>
            <p className="mt-1 text-sm text-neutral-500">{state.filename}</p>
          </div>

          <div className="mt-4 flex w-full flex-col gap-3">
            <Button size="lg" loading={busy} onClick={handleShare}>
              <Share2 size={18} /> Compartir
            </Button>
            <Button size="lg" variant="secondary" onClick={() => downloadPdf(state.bytes, state.filename)}>
              <Download size={18} /> Descargar
            </Button>
            <Button size="lg" variant="ghost" onClick={() => navigate("/")}>
              Volver al inicio
            </Button>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
