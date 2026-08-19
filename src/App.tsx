import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { NewFactura } from "./pages/NewFactura";
import { NewPresupuesto } from "./pages/NewPresupuesto";
import { NewAviso } from "./pages/NewAviso";
import { DocumentReady } from "./pages/DocumentReady";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-neutral-400">Cargando…</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/nueva-factura" element={<NewFactura />} />
      <Route path="/nuevo-presupuesto" element={<NewPresupuesto />} />
      <Route path="/nuevo-aviso" element={<NewAviso />} />
      <Route path="/documento-listo" element={<DocumentReady />} />
      <Route path="/historial" element={<History />} />
      <Route path="/ajustes" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
