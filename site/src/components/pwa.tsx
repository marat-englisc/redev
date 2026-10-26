"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Workbox } from "workbox-window";
import { toast } from "sonner";
import { BASE_PATH } from "@/lib/assets";

/* ───────────── установка приложения ───────────── */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let installEvent: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribeInstall(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);

/** Можно ли предложить установку (Chrome/Edge/Android) и запущено ли уже как приложение. */
export function useInstallPrompt() {
  const canInstall = useSyncExternalStore(
    subscribeInstall,
    () => installEvent !== null,
    () => false,
  );
  const installed = useSyncExternalStore(subscribeInstall, isStandalone, () => false);

  const install = async () => {
    if (!installEvent) return false;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    installEvent = null;
    emit();
    return outcome === "accepted";
  };

  return { canInstall, installed, install };
}

/* ───────────── service worker ───────────── */

/**
 * Регистрирует service worker (его генерирует Workbox после сборки — scripts/build-sw.mjs),
 * предлагает обновиться до новой версии и сообщает о переходе в офлайн.
 * В dev service worker не нужен: он мешал бы горячей перезагрузке.
 */
export function PwaRegister() {
  const registered = useRef(false);

  useEffect(() => {
    const onInstallPrompt = (e: Event) => {
      e.preventDefault(); // показываем свою кнопку в настройках вместо мини-баннера браузера
      installEvent = e as BeforeInstallPromptEvent;
      emit();
    };
    const onInstalled = () => {
      installEvent = null;
      emit();
      toast.success("Приложение установлено");
    };
    const onOffline = () =>
      toast("Нет подключения", { description: "Доступны сохранённые уроки, повторение и статистика.", id: "network" });
    const onOnline = () => toast("Снова онлайн", { id: "network", duration: 2000 });

    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator && !registered.current) {
      registered.current = true;
      const wb = new Workbox(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` });

      // новая версия скачана и ждёт — спрашиваем, а не перезагружаем страницу посреди чтения
      wb.addEventListener("waiting", () => {
        toast("Доступна новая версия сайта", {
          id: "sw-update",
          duration: Infinity,
          action: {
            label: "Обновить",
            onClick: () => {
              wb.addEventListener("controlling", () => window.location.reload());
              wb.messageSkipWaiting();
            },
          },
        });
      });

      wb.register().catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
