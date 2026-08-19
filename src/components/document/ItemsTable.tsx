import { Plus, Trash2 } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import type { LineItem } from "../../types";

interface Props {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

export function ItemsTable({ items, onChange }: Props) {
  function update(index: number, patch: Partial<LineItem>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addRow() {
    onChange([...items, { description: "", unitPrice: 0, quantity: 1 }]);
  }

  function removeRow(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-3">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                label={`Línea ${i + 1}`}
                value={item.description}
                onChange={(e) => update(i, { description: e.target.value })}
                placeholder="Descripción del trabajo"
              />
            </div>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="mt-7 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-red-600 hover:bg-red-50"
                aria-label="Eliminar línea"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              label="Importe (€)"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              value={item.unitPrice || ""}
              onChange={(e) => update(i, { unitPrice: parseFloat(e.target.value) || 0 })}
              className="text-right"
            />
            <Input
              label="Cantidad"
              type="number"
              inputMode="numeric"
              min={0}
              value={item.quantity || ""}
              onChange={(e) => update(i, { quantity: parseFloat(e.target.value) || 0 })}
              className="text-right"
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={addRow} className="self-start">
        <Plus size={16} /> Añadir línea
      </Button>
    </div>
  );
}
