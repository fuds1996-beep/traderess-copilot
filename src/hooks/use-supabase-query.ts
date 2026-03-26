"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Generic hook for Supabase queries.
 * Returns `{ data, loading, error }`.
 * If the query fails or returns no data, `data` will be the `fallback` value.
 */
export function useSupabaseQuery<T>(
  queryFn: (supabase: ReturnType<typeof createClient>) => Promise<{ data: T | null; error: unknown }>,
  fallback: T,
): { data: T; loading: boolean; error: string | null } {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const { data: result, error: err } = await queryFn(supabase);

        if (cancelled) return;

        if (err) {
          setError(typeof err === "object" && err !== null && "message" in err ? (err as { message: string }).message : "Query failed");
          setData(fallback);
        } else if (result === null || (Array.isArray(result) && result.length === 0)) {
          // No data — return the fallback (empty state)
          setData(fallback);
        } else {
          setData(result);
        }
      } catch {
        // Network error / Supabase not configured
        if (!cancelled) setData(fallback);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error };
}
