"use client";

import { useState, useCallback, useSyncExternalStore } from "react";

type Listener = () => void;

function createThreadStore(storageKey: string) {
  let cachedId: string | null = null;
  const listeners = new Set<Listener>();

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => {
      if (typeof window === "undefined") return "";
      if (cachedId === null) {
        const stored = localStorage.getItem(storageKey);
        cachedId = stored || crypto.randomUUID();
        localStorage.setItem(storageKey, cachedId);
      }
      return cachedId;
    },
    getServerSnapshot: () => "",
    setThreadId: (id: string) => {
      cachedId = id;
      localStorage.setItem(storageKey, id);
      notify();
    },
  };
}

export function useThreadManager(storageKey: string) {
  const [store] = useState(() => createThreadStore(storageKey));

  const threadId = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  const isHydrated = threadId !== "";

  const handleNewThread = useCallback(() => {
    store.setThreadId(crypto.randomUUID());
  }, [store]);

  const handleLoadThread = useCallback(
    (id: string) => {
      store.setThreadId(id);
    },
    [store]
  );

  return {
    threadId,
    isHydrated,
    onNewThread: handleNewThread,
    onLoadThread: handleLoadThread,
  };
}
