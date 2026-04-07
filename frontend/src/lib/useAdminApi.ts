import { useState, useEffect, useCallback, useRef } from "react";
import api from "./api";

export type UseResourceApi<T> = {
  data: T[];
  loading: boolean;
  error: string | null;
  create: (payload: Record<string, unknown>) => Promise<T>;
  update: (payload: Record<string, unknown>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  refresh: () => void;
};

/**
 * Generic CRUD hook for admin resource pages.
 *
 * @param endpoint  e.g. "/user"
 * @param dataKey   e.g. "users" — the key in the response JSON that holds the array
 * @param entityKey e.g. "user"  — the wrapper key the backend expects for create/update bodies
 */
export function useResourceApi<T extends { _id?: string; id?: string }>(
  endpoint: string,
  dataKey: string,
  entityKey: string,
): UseResourceApi<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const revision = useRef(0);

  const fetch = useCallback(() => {
    revision.current += 1;
    const thisRevision = revision.current;
    setLoading(true);
    setError(null);

    api
      .get(endpoint)
      .then((res) => {
        if (thisRevision !== revision.current) return;
        const list = res.data?.[dataKey];
        setData(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        if (thisRevision !== revision.current) return;
        setError(e instanceof Error ? e.message : "Failed to load data");
      })
      .finally(() => {
        if (thisRevision !== revision.current) return;
        setLoading(false);
      });
  }, [endpoint, dataKey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = useCallback(
    async (payload: Record<string, unknown>): Promise<T> => {
      const res = await api.post(endpoint, { [entityKey]: payload });
      const created = res.data?.[entityKey] as T;
      setData((prev) => [...prev, created]);
      return created;
    },
    [endpoint, entityKey],
  );

  const update = useCallback(
    async (payload: Record<string, unknown>): Promise<T> => {
      const res = await api.put(endpoint, { [entityKey]: payload });
      const updated = res.data?.[entityKey] as T;
      const id = updated._id ?? updated.id;
      setData((prev) =>
        prev.map((item) => ((item._id ?? item.id) === id ? updated : item)),
      );
      return updated;
    },
    [endpoint, entityKey],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await api.delete(`${endpoint}/${id}`);
      setData((prev) => prev.filter((item) => (item._id ?? item.id) !== id));
    },
    [endpoint],
  );

  return { data, loading, error, create, update, remove, refresh: fetch };
}
