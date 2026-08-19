const MESSAGES: Record<string, string> = {
  "auth/invalid-email": "El correo no es válido.",
  "auth/user-disabled": "Esta cuenta está deshabilitada.",
  "auth/user-not-found": "No existe ninguna cuenta con ese correo.",
  "auth/wrong-password": "Contraseña incorrecta.",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/too-many-requests": "Demasiados intentos. Prueba de nuevo en unos minutos.",
  "auth/network-request-failed": "Sin conexión. Comprueba tu red e inténtalo de nuevo.",
  "permission-denied": "No tienes permiso para hacer esto.",
  unavailable: "Sin conexión con el servidor. Inténtalo de nuevo.",
};

export function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return err instanceof Error ? err.message : "Ha ocurrido un error inesperado.";
}
