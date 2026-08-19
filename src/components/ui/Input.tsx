import { forwardRef, type InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, hint, className = "", id, ...rest }, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    // `className` (flex-1, w-28...) va en el <label>: es el hijo real dentro
    // de las filas flex del formulario. El <input> siempre ocupa el 100% de
    // ese ancho (min-w-0 evita que un input nativo (date/number) fuerce un
    // desbordamiento horizontal al no poder encogerse por debajo de su
    // tamaño de contenido).
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`} htmlFor={inputId}>
      {label && <span className="text-sm font-medium text-neutral-700">{label}</span>}
      <input
        ref={ref}
        id={inputId}
        className="h-12 w-full min-w-0 rounded-xl border border-neutral-300 bg-white px-3.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        {...rest}
      />
      {hint && <span className="text-xs text-neutral-500">{hint}</span>}
    </label>
  );
});
Input.displayName = "Input";
