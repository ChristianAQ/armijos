import { useEffect, useState } from "react";
import { listDocuments } from "../services/documents.service";
import type { StoredDocument } from "../types";

export function useDocumentHistory() {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listDocuments()
      .then((d) => active && setDocuments(d))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { documents, loading };
}
