/** Sugerencia de siguiente número de factura a partir del último usado
 * (incrementa la parte numérica final, p. ej. "32" -> "33"). Si no hay
 * histórico o el último número no es puramente numérico, empieza en "1". */
export function suggestNextNumber(last: string | null): string {
  if (!last) return "1";
  const match = last.match(/(\d+)\s*$/);
  if (!match) return last;
  const digits = match[1];
  const next = String(parseInt(digits, 10) + 1).padStart(digits.length, "0");
  return last.slice(0, match.index) + next;
}
