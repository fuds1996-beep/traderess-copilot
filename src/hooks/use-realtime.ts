"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribe to Supabase Realtime changes on a table.
 * Calls `onUpdate` whenever an INSERT, UPDATE, or DELETE occurs.
 * Cleans up on unmount.
 */
export function useRealtimeSubscription(
  tableName: string,
  enabled: boolean,
  onUpdate: () => void,
) {
  // Stable callback ref — updated via useEffect to avoid render-time ref access
  const callbackRef = useRef(onUpdate);
  useEffect(() => {
    callbackRef.current = onUpdate;
  });

  const handler = useCallback(() => {
    callbackRef.current();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`realtime-${tableName}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        handler,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, enabled, handler]);
}
