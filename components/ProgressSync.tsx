"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

export function ProgressSync() {
  const store = useStore();
  const lastSent = useRef("");
  const pulling = useRef(false);
  const ensuring = useRef("");

  useEffect(() => {
    lastSent.current = "";
    pulling.current = false;
    ensuring.current = "";
  }, [store.profileId]);

  useEffect(() => {
    if (store.syncCode) return;
    const name = store.studentName.trim();
    if (!name) return;
    const key = `${store.profileId}:${name.toLowerCase()}`;
    if (ensuring.current === key) return;
    ensuring.current = key;
    let cancelled = false;
    (async () => {
      try {
        const probe = await fetch("/api/sync");
        const avail = await probe.json() as { available?: boolean };
        if (!avail.available || cancelled) return;
        const found = await fetch(`/api/sync?name=${encodeURIComponent(name)}`);
        if (cancelled) return;
        if (found.ok) {
          const data = await found.json() as { code?: string; state?: Record<string, unknown> };
          if (!data.code) return;
          if (data.state) {
            lastSent.current = JSON.stringify(data.state);
            store.mergeRemote({ ...data.state, syncCode: data.code });
          } else {
            store.set({ syncCode: data.code });
          }
          return;
        }
        const created = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: store.exportState() }),
        });
        if (cancelled || !created.ok) return;
        const data = await created.json() as { code?: string };
        if (data.code) store.set({ syncCode: data.code, savedAt: new Date().toISOString() });
      } catch {
        /* keep local copy */
      } finally {
        if (cancelled) ensuring.current = "";
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.profileId, store.studentName, store.syncCode]);

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
