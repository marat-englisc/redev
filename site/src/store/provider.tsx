"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { hydrate, makeStore, selectPersisted, STORAGE_KEY, type AppStore, type PersistedState } from "./index";

function load(): Partial<PersistedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedState>) : null;
  } catch {
    return null;
  }
}

/**
 * Redux-стор живёт только в браузере. Состояние читается из localStorage
 * после монтирования (чтобы не ломать гидрацию статического HTML) и
 * сохраняется обратно при каждом изменении с небольшой задержкой.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStore>(makeStore);

  useEffect(() => {
    store.dispatch(hydrate(load()));

    let timer: ReturnType<typeof setTimeout> | undefined;
    let prev = selectPersisted(store.getState());
    const save = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectPersisted(store.getState())));
      } catch {}
    };
    const unsubscribe = store.subscribe(() => {
      const next = selectPersisted(store.getState());
      if (next.progress === prev.progress && next.srs === prev.srs && next.settings === prev.settings) return;
      prev = next;
      clearTimeout(timer);
      timer = setTimeout(save, 250);
    });

    // синхронизация между вкладками
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      store.dispatch(hydrate(load()));
      prev = selectPersisted(store.getState());
    };
    const flush = () => {
      if (timer) {
        clearTimeout(timer);
        save();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      unsubscribe();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", flush);
    };
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
