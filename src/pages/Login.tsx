import { useState } from "react";
import { signIn, resetPassword } from "../services/auth.service";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useToast } from "../context/ToastContext";
import { friendlyError } from "../lib/errors";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Escribe tu correo primero para poder enviarte el enlace.");
      return;
    }
    try {
      await resetPassword(email);
      show("Te hemos enviado un correo para restablecer tu contraseña.", "success");
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col justify-center bg-brand-dark px-6 py-10"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark text-2xl text-white">
            🌿
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Armijos</h1>
          <p className="mt-1 text-sm text-neutral-500">Facturas, presupuestos y avisos en segundos.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <Input label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <Button type="submit" size="lg" loading={loading} className="mt-1">
            Iniciar sesión
          </Button>
        </form>

        <button onClick={handleForgotPassword} className="mt-3 w-full text-center text-sm text-brand-dark">
          ¿Olvidaste tu contraseña?
        </button>
      </div>
    </div>
  );
}
