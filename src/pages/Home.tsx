import { Link } from "react-router-dom";
import { FileText, ClipboardList, TriangleAlert, History, Settings, LogOut } from "lucide-react";
import { logOut } from "../services/auth.service";
import { PageContainer } from "../components/layout/PageContainer";

const ACTIONS = [
  { to: "/nueva-factura", label: "Nueva factura", icon: FileText },
  { to: "/nuevo-presupuesto", label: "Nuevo presupuesto", icon: ClipboardList },
  { to: "/nuevo-aviso", label: "Nuevo aviso de mantenimiento", icon: TriangleAlert },
];

export function Home() {
  return (
    <div style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <PageContainer>
        <div className="mb-6 flex items-center justify-between pt-2">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Armijos</h1>
            <p className="text-sm text-neutral-500">Jardinería y mantenimiento</p>
          </div>
          <button
            onClick={() => logOut()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
            aria-label="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {ACTIONS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark">
                <Icon size={22} />
              </div>
              <span className="text-base font-semibold text-neutral-900">{label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            to="/historial"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-700"
          >
            <History size={16} /> Historial
          </Link>
          <Link
            to="/ajustes"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-700"
          >
            <Settings size={16} /> Ajustes
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}
