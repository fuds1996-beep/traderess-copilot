"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Generic hook for Supabase queries with mock fallback.
 * Returns `{ data, loading, error }`.
 * If the Supabase query fails or returns no data, `fallback` is used.
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
          // Supabase errors (including missing tables during dev) → use fallback
          setError(typeof err === "object" && err !== null && "message" in err ? (err as { message: string }).message : "Query failed");
          setData(fallback);
        } else if (result === null || (Array.isArray(result) && result.length === 0)) {
          // No data yet → use fallback (demo mode)
          setData(fallback);
        } else {
          setData(result);
        }
      } catch {
        // Network error / Supabase not configured → use fallback silently
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
