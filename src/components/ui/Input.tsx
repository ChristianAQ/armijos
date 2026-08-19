import { forwardRef, type InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, hint, className = "", id, ...rest }, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="flex flex-col gap-1.5" htmlFor={inputId}>
      {label && <span className="text-sm font-medium text-neutral-700">{label}</span>}
      <input
        ref={ref}
        id={inputId}
        className={`h-12 rounded-xl border border-neutral-300 bg-white px-3.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${className}`}
        {...rest}
      />
      {hint && <span className="text-xs text-neutral-500">{hint}</span>}
    </label>
  );
});
Input.displayName = "Input";
