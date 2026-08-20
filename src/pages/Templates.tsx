import { useNavigate } from "react-router-dom";
import { Files, Pencil, Trash2 } from "lucide-react";
import { TopBar } from "../components/layout/TopBar";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/ui/EmptyState";
import { useTemplates } from "../hooks/useTemplates";
import { useToast } from "../context/ToastContext";
import { deleteTemplate } from "../services/templates.service";
import { friendlyError } from "../lib/errors";
import type { FacturaTemplate } from "../types";

export function Templates() {
  const { templates, loading, setTemplates } = useTemplates();
  const navigate = useNavigate();
  const { show } = useToast();

  function handleUse(template: FacturaTemplate) {
    navigate("/nueva-factura", { state: { template } });
  }

  function handleEdit(e: React.MouseEvent, template: FacturaTemplate) {
    e.stopPropagation();
    navigate(`/plantillas/${template.id}`, { state: { template } });
  }

  async function handleDelete(e: React.MouseEvent, template: FacturaTemplate) {
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar la factura recurrente "${template.name}"?`)) return;
    try {
      await deleteTemplate(template.id);
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    } catch (err) {
      show(friendlyError(err), "error");
    }
  }

  return (
    <div>
      <TopBar title="Facturas de clientes recurrentes" />
      <PageContainer>
        {!loading && templates.length === 0 && (
          <EmptyState
            title="Sin facturas recurrentes todavía"
            description='Rellena una factura y pulsa "Guardar como factura recurrente" para tenerla lista el mes que viene.'
          />
        )}
        <div className="flex flex-col gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleUse(template)}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-dark">
                <Files size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900">{template.name}</p>
                <p className="truncate text-sm text-neutral-500">{template.clientSnapshot.name}</p>
              </div>
              <span
                role="button"
                onClick={(e) => handleEdit(e, template)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
                aria-label="Editar factura recurrente"
              >
                <Pencil size={17} />
              </span>
              <span
                role="button"
                onClick={(e) => handleDelete(e, template)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                aria-label="Eliminar factura recurrente"
              >
                <Trash2 size={17} />
              </span>
            </button>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
