import { useEffect, useState } from "react";
import { listTemplates } from "../services/templates.service";
import type { FacturaTemplate } from "../types";

export function useTemplates() {
  const [templates, setTemplates] = useState<FacturaTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listTemplates()
      .then((t) => active && setTemplates(t))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { templates, loading, setTemplates };
}
