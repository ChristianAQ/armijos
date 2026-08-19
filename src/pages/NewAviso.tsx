import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/layout/TopBar";
import { PageContainer } from "../components/layout/PageContainer";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { useDocumentHistory } from "../hooks/useDocumentHistory";
import { buildAvisoPdf } from "../pdf/aviso";
import { saveDocument } from "../services/documents.service";
import { todayIso } from "../lib/format";
import { friendlyError } from "../lib/errors";
import type { AvisoData } from "../types";

const REASON_CHIPS = [
  "limpieza con máquina Karcher",
  "poda de árboles y arbustos",
  "riego y mantenimiento de zonas verdes",
  "fumigación",
];

export function NewAviso() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { documents } = useDocumentHistory();

  const [zone, setZone] = useState("");
  const [date, setDate] = useState(todayIso());
  const [timeFrom, setTimeFrom] = useState("09:00");
  const [timeTo, setTimeTo] = useState("11:00");
  const [reason, setReason] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const previousZones = useMemo(() => {
    const zones = documents.filter((d) => d.data.type === "aviso").map((d) => (d.data as AvisoData).zone);
    return Array.from(new Set(zones));
  }, [documents]);

  const canSubmit = zone.trim().length > 0 && reason.trim().length > 0 && timeFrom && timeTo;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const data: AvisoData = { type: "aviso", date, zone: zone.trim(), timeFrom, timeTo, reason: reason.trim(), extraNote };
      const bytes = await buildAvisoPdf(data);
      await saveDocument(data);
      const filename = `Aviso de mantenimiento - ${zone}.pdf`;
      navigate("/documento-listo", { state: { bytes, filename } });
    } catch (err) {
      show(friendlyError(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <TopBar title="Nuevo aviso" />
      <PageContainer>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <Input
              label="Instalación o zona afectada"
              list="zones-datalist"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="la cancha de tenis"
              hint='Escríbelo con el artículo, ej. "la piscina", "el gimnasio"'
              required
            />
            <datalist id="zones-datalist">
              {previousZones.map((z) => (
                <option key={z} value={z} />
              ))}
            </datalist>
          </div>

          <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

          <div className="flex gap-3">
            <Input label="Desde" type="time" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} className="flex-1" required />
            <Input label="Hasta" type="time" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} className="flex-1" required />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-neutral-700">Motivo del trabajo</span>
            <div className="mb-2 flex flex-wrap gap-2">
              {REASON_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setReason(chip)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    reason === chip ? "border-brand-dark bg-brand-dark text-white" : "border-neutral-300 text-neutral-700"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo del trabajo" required />
          </div>

          <Textarea
            label="Nota adicional (opcional)"
            value={extraNote}
            onChange={(e) => setExtraNote(e.target.value)}
            placeholder="Cualquier detalle extra para el aviso"
          />

          <Button type="submit" size="lg" loading={submitting} disabled={!canSubmit}>
            Generar PDF
          </Button>
        </form>
      </PageContainer>
    </div>
  );
}
