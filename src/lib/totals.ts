import type { LineItem } from "../types";

export function computeTotals(items: LineItem[], applyIva: boolean) {
  const base = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const iva = applyIva ? base * 0.21 : 0;
  return { base, iva, total: base + iva };
}
