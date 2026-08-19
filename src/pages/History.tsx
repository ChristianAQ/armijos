import { useNavigate } from "react-router-dom";
import { FileText, ClipboardList, TriangleAlert } from "lucide-react";
import { TopBar } from "../components/layout/TopBar";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/ui/EmptyState";
import { useDocumentHistory } from "../hooks/useDocumentHistory";
import { useToast } from "../context/ToastContext";
import { buildFacturaPdf } from "../pdf/factura";
import { buildPresupuestoPdf } from "../pdf/presupuesto";
import { buildAvisoPdf } from "../pdf/aviso";
import { formatDateEs } from "../pdf/layout";
import { friendlyError } from "../lib/errors";
import type { StoredDocument } from "../types";

const ICONS = { factura: FileText, presupuesto: ClipboardList, aviso: TriangleAlert };
const LABELS = { factura: "Factura", presupuesto: "Presupuesto", aviso: "Aviso de mantenimiento" };

function subtitle(doc: StoredDocument): string {
  const { data } = doc;
  if (data.type === "aviso") return data.zone;
  return data.clientSnapshot.name;
}

async function regenerate(doc: StoredDocument): Promise<{ bytes: Uint8Array; filename: string }> {
  const { data } = doc;
  if (data.type === "factura") {
    return { bytes: await buildFacturaPdf(data), filename: `Factura ${data.number} - ${data.clientSnapshot.name}.pdf` };
  }
  if (data.type === "presupuesto") {
    return { bytes: await buildPresupuestoPdf(data), filename: `Presupuesto - ${data.clientSnapshot.name}.pdf` };
  }
  return { bytes: await buildAvisoPdf(data), filename: `Aviso de mantenimiento - ${data.zone}.pdf` };
}

export function History() {
  const { documents, loading } = useDocumentHistory();
  const navigate = useNavigate();
  const { show } = useToast();

  async function handleOpen(doc: StoredDocument) {
    try {
      const result = await regenerate(doc);
      navigate("/documento-listo", { state: result });
    } catch (err) {
      show(friendlyError(err), "error");
    }
  }

  return (
    <div>
      <TopBar title="Historial" />
      <PageContainer>
        {!loading && documents.length === 0 && (
          <EmptyState title="Sin documentos todavía" description="Los documentos que generes aparecerán aquí." />
        )}
        <div className="flex flex-col gap-2">
          {documents.map((doc) => {
            const Icon = ICONS[doc.data.type];
            return (
              <button
                key={doc.id}
                onClick={() => handleOpen(doc)}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left active:scale-[0.98]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-dark">
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">{LABELS[doc.data.type]}</p>
                  <p className="truncate text-sm text-neutral-500">{subtitle(doc)}</p>
                </div>
                <span className="shrink-0 text-xs text-neutral-400">{formatDateEs(doc.data.date)}</span>
              </button>
            );
          })}
        </div>
      </PageContainer>
    </div>
  );
}
