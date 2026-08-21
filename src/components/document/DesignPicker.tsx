import type { PdfDesign } from "../../types";

interface Props {
  value: PdfDesign;
  onChange: (design: PdfDesign) => void;
}

const OPTIONS: { value: PdfDesign; label: string }[] = [
  { value: "clasico", label: "Clásico" },
  { value: "moderno", label: "Moderno" },
];

export function DesignPicker({ value, onChange }: Props) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-neutral-700">Diseño del PDF</span>
      <div className="flex gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium ${
              value === option.value ? "border-brand-dark bg-brand-dark text-white" : "border-neutral-300 text-neutral-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
