"use client";

import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { DownloadIcon, UploadIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector, useAppStore, useHydrated } from "@/store/hooks";
import { hydrate, resetAll, selectPersisted, updateSettings, type PersistedState } from "@/store";
import { dayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

function Row({ title, desc, children }: { title: string; desc: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 border-b py-7 md:grid-cols-[1fr_minmax(0,320px)] md:items-center md:gap-10">
      <div>
        <div className="font-medium">{title}</div>
        <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</div>
      </div>
      <div className="flex items-center justify-start md:justify-end">{children}</div>
    </div>
  );
}

function SliderField({ value, min, max, step, onChange, format }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  return (
    <div className="flex w-full items-center gap-4">
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))} />
      <span className="w-14 shrink-0 text-right font-mono text-sm tabular-nums">{format(value)}</span>
    </div>
  );
}

export function SettingsView() {
  const hydrated = useHydrated();
  const settings = useAppSelector((s) => s.settings);
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const { theme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState(false);

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ app: "refront", version: 1, exportedAt: new Date().toISOString(), ...selectPersisted(store.getState()) }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `refront-progress-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Резервная копия сохранена");
  };

  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as Partial<PersistedState>;
      if (!data || typeof data !== "object" || !("srs" in data || "progress" in data)) throw new Error("bad");
      dispatch(hydrate({ progress: data.progress, srs: data.srs, settings: data.settings }));
      toast("Прогресс восстановлен из файла");
    } catch {
      toast.error("Не удалось прочитать файл резервной копии");
    }
  };

  return (
    <main className={cn("mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 sm:py-16 transition-opacity", !hydrated && "opacity-0")}>
      <div className="label">Параметры</div>
      <h1 className="mt-3 text-5xl font-semibold tracking-[-0.045em] sm:text-7xl">Настройки</h1>

      <h2 className="label mt-14">Оформление</h2>
      <div className="border-t">
        <Row title="Тема" desc="Строгая монохромная палитра — светлая или тёмная.">
          <div className="inline-flex rounded-lg border p-0.5">
            {[
              ["light", "Светлая"],
              ["dark", "Тёмная"],
              ["system", "Системная"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTheme(k)}
                className={cn("rounded-md px-3 py-1.5 text-sm transition-colors", theme === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
              >
                {l}
              </button>
            ))}
          </div>
        </Row>
      </div>

      <h2 className="label mt-14">Интервальное повторение · FSRS</h2>
      <div className="border-t">
        <Row
          title="Желаемая запоминаемость"
          desc="Вероятность вспомнить карточку в момент повторения. Выше — чаще повторения, ниже — реже, но больше забываний. Оптимум обычно 0.85–0.92."
        >
          <SliderField value={settings.retention} min={0.7} max={0.97} step={0.01} onChange={(v) => dispatch(updateSettings({ retention: Math.round(v * 100) / 100 }))} format={(v) => v.toFixed(2)} />
        </Row>
        <Row title="Новых карточек в день" desc="Сколько новых карточек вводить ежедневно. Каждая новая карточка порождает несколько повторений в первые дни.">
          <SliderField value={settings.newPerDay} min={0} max={100} step={1} onChange={(v) => dispatch(updateSettings({ newPerDay: v }))} format={String} />
        </Row>
        <Row title="Максимальный интервал" desc="Верхняя граница интервала между повторениями, в днях.">
          <SliderField value={settings.maxInterval} min={30} max={3650} step={5} onChange={(v) => dispatch(updateSettings({ maxInterval: v }))} format={(v) => `${v} д`} />
        </Row>
        <Row title="Разброс интервалов" desc="Немного рандомизирует интервалы, чтобы карточки, изученные в один день, не приходили всегда вместе.">
          <Switch checked={settings.fuzz} onCheckedChange={(v) => dispatch(updateSettings({ fuzz: v }))} />
        </Row>
        <Row title="Автодобавление в колоду" desc="Когда урок отмечается изученным, его карточка автоматически попадает в повторение.">
          <Switch checked={settings.autoAdd} onCheckedChange={(v) => dispatch(updateSettings({ autoAdd: v }))} />
        </Row>
      </div>

      <h2 className="label mt-14">Данные</h2>
      <div className="border-t">
        <Row
          title="Резервная копия"
          desc="Весь прогресс хранится только в localStorage этого браузера. Сохраните файл, чтобы перенести его на другое устройство или не потерять при очистке данных."
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportData}>
              <DownloadIcon /> Экспорт
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <UploadIcon /> Импорт
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
                e.target.value = "";
              }}
            />
          </div>
        </Row>
        <Row title="Сбросить прогресс" desc="Удалит отметки уроков, все карточки и историю повторений. Действие необратимо.">
          <Button variant="destructive" onClick={() => setConfirm(true)}>
            <Trash2Icon /> Сбросить всё
          </Button>
        </Row>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сбросить весь прогресс?</DialogTitle>
            <DialogDescription>Отметки уроков, карточки FSRS и статистика будут удалены. Рекомендуем сначала сделать экспорт.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button
              variant="default"
              onClick={() => {
                dispatch(resetAll());
                setConfirm(false);
                toast("Прогресс сброшен");
              }}
            >
              Сбросить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
