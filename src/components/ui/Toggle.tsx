interface Props {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: Props) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-neutral-300 bg-white px-3.5 py-3"
      aria-pressed={checked}
    >
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-brand-dark" : "bg-neutral-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-5" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
