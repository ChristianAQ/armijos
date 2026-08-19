import { type SelectHTMLAttributes } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className = "", id, children, ...rest }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="flex flex-col gap-1.5" htmlFor={inputId}>
      {label && <span className="text-sm font-medium text-neutral-700">{label}</span>}
      <select
        id={inputId}
        className={`h-12 rounded-xl border border-neutral-300 bg-white px-3.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${className}`}
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}
