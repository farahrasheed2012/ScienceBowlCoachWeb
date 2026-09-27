"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

export function ProgressSync() {
  const store = useStore();
  const lastSent = useRef("");
  const pulling = useRef(false);

  useEffect(() => {
    lastSent.current = "";
    pulling.current = false;
  }, [store.profileId]);

  useEffect(() => {
    if (!store.syncCode) return;
    let cancelled = false;
    pulling.current = true;
    fetch(`/api/sync?code=${encodeURIComponent(store.syncCode)}`)
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data = await res.json() as { state?: Record<string, unknown> };
        if (!data.state || cancelled) return;
        lastSent.current = JSON.stringify(data.state);
        store.mergeRemote({ ...data.state, syncCode: store.syncCode });
      })
      .catch(() => {
        /* keep local copy */
      })
      .finally(() => {
        pulling.current = false;
      });
    return () => {
      cancelled = true;
    };
  }, [store.syncCode]);

  useEffect(() => {
    if (!store.syncCode || pulling.current) return;
    const snapshot = JSON.stringify(store.exportState());
    if (snapshot === lastSent.current) return;
    const timer = window.setTimeout(() => {
      lastSent.current = snapshot;
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: store.syncCode, state: store.exportState() }),
      }).catch(() => {
        /* keep local copy */
      });
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [store]);

  return null;
}
