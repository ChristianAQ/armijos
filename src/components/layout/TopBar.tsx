import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TopBar({ title, back = true, right }: { title: string; back?: boolean; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div
      className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-neutral-200 bg-white/90 px-3 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-brand-dark hover:bg-neutral-100"
          aria-label="Volver"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      <h1 className="flex-1 text-base font-semibold text-neutral-900">{title}</h1>
      {right}
    </div>
  );
}
