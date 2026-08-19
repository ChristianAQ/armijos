import { forwardRef, type TextareaHTMLAttributes } from "react";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(({ label, className = "", id, ...rest }, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`} htmlFor={inputId}>
      {label && <span className="text-sm font-medium text-neutral-700">{label}</span>}
      <textarea
        ref={ref}
        id={inputId}
        rows={3}
        className="w-full min-w-0 rounded-xl border border-neutral-300 bg-white px-3.5 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        {...rest}
      />
    </label>
  );
});
Textarea.displayName = "Textarea";
