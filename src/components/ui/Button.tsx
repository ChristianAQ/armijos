import { type ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, className = "", children, disabled, ...rest }: Props) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
  const sizes = size === "lg" ? "h-14 px-5 text-base" : "h-11 px-4 text-sm";
  const variants =
    variant === "primary"
      ? "bg-brand-dark text-white hover:bg-brand-deep"
      : variant === "secondary"
        ? "bg-white text-brand-dark border border-neutral-300 hover:bg-neutral-50"
        : "text-brand-dark hover:bg-neutral-100";

  return (
    <button className={`${base} ${sizes} ${variants} ${className}`} disabled={disabled || loading} {...rest}>
      {loading ? "…" : children}
    </button>
  );
}
