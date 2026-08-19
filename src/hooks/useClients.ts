import { useEffect, useState } from "react";
import { listClients } from "../services/clients.service";
import type { Client } from "../types";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listClients()
      .then((c) => active && setClients(c))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { clients, loading, setClients };
}
