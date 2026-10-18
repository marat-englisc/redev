"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { BrainIcon, CheckIcon, CircleIcon, MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppDispatch, useAppSelector, useHydrated } from "@/store/hooks";
import { addCards, removeCards, setCompleted, visit } from "@/store";
import { State } from "@/store/srs";
import { relativeDay } from "@/lib/date";
import { cn } from "@/lib/utils";

export function LessonActions({ id, href, title, variant = "header" }: { id: string; href: string; title: string; variant?: "header" | "footer" }) {
  const dispatch = useAppDispatch();
  const hydrated = useHydrated();
  const done = useAppSelector((s) => Boolean(s.progress.lessons[id]?.c));
  const card = useAppSelector((s) => s.srs.cards[id]);
  const autoAdd = useAppSelector((s) => s.settings.autoAdd);

  useEffect(() => {
    if (hydrated && variant === "header") dispatch(visit({ id, href, title }));
  }, [hydrated, id, href, title, variant, dispatch]);

  const toggleDone = () => {
    dispatch(setCompleted({ ids: [id], value: !done }));
    if (!done && autoAdd && !card) {
      dispatch(addCards([id]));
      toast("Урок изучен", { description: "Карточка добавлена в интервальное повторение" });
    } else if (!done) {
      toast("Урок отмечен изученным");
    }
  };

  const toggleDeck = () => {
    if (card) {
      dispatch(removeCards([id]));
      toast("Карточка убрана из повторения");
    } else {
      dispatch(addCards([id]));
      toast("Карточка добавлена в повторение");
    }
  };

  const deckLabel = card ? (card.state === State.New ? "В колоде · новая" : `Повтор ${relativeDay(card.due)}`) : "В повторение";

  if (variant === "footer") {
    return (
      <div className={cn("flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between transition-opacity", !hydrated && "opacity-0")}>
        <div>
          <div className="text-lg font-semibold tracking-tight">{done ? "Урок изучен" : "Дочитали до конца?"}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {done ? "Карточка поможет не забыть материал." : "Отметьте урок — прогресс сохранится в браузере."}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="lg" variant={done ? "outline" : "default"} className="px-4" onClick={toggleDone}>
            {done ? <MinusIcon /> : <CheckIcon />}
            {done ? "Снять отметку" : "Отметить изученным"}
          </Button>
          {!card && (
            <Button size="lg" variant="outline" className="px-4" onClick={toggleDeck}>
              <BrainIcon /> В повторение
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2 transition-opacity", !hydrated && "opacity-0")}>
      <Button variant={done ? "default" : "outline"} onClick={toggleDone} className="rounded-full px-3.5">
        {done ? <CheckIcon /> : <CircleIcon />}
        {done ? "Изучено" : "Отметить изученным"}
      </Button>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" onClick={toggleDeck} className="rounded-full px-3.5" />}>
          {card ? <BrainIcon /> : <PlusIcon />}
          {deckLabel}
        </TooltipTrigger>
        <TooltipContent>{card ? "Нажмите, чтобы убрать из колоды" : "Добавить карточку «вопрос → краткий ответ» в FSRS"}</TooltipContent>
      </Tooltip>
    </div>
  );
}
