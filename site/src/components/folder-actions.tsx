"use client";

import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { BrainIcon, CheckCheckIcon, MoreHorizontalIcon, PlusIcon, RotateCcwIcon, Undo2Icon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector, useHydrated } from "@/store/hooks";
import { addCards, removeCards, setCompleted } from "@/store";
import { useCompletion } from "@/hooks/use-srs";
import { plural } from "@/lib/date";
import { cn } from "@/lib/utils";

export function FolderActions({ id, ids }: { id: string; ids: string[] }) {
  const dispatch = useAppDispatch();
  const hydrated = useHydrated();
  const cards = useAppSelector((s) => s.srs.cards);
  const { done, total } = useCompletion(ids);
  const inDeck = useMemo(() => ids.filter((i) => cards[i]).length, [ids, cards]);
  const missing = total - inDeck;

  const addAll = () => {
    dispatch(addCards(ids));
    toast(`${missing} ${plural(missing, ["карточка добавлена", "карточки добавлены", "карточек добавлено"])} в повторение`);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2 transition-opacity", !hydrated && "opacity-0")}>
      {inDeck > 0 ? (
        <Link href={`/review/?scope=${id}`} className={buttonVariants({ size: "lg", className: "px-4" })}>
          <BrainIcon /> Повторить раздел
          <span className="font-mono text-xs opacity-60">{inDeck}</span>
        </Link>
      ) : (
        <Button size="lg" className="px-4" onClick={addAll}>
          <PlusIcon /> Учить карточками
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon-lg" aria-label="Ещё действия" />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {missing > 0 && inDeck > 0 && (
            <DropdownMenuItem onClick={addAll}>
              <PlusIcon /> Добавить оставшиеся ({missing}) в повторение
            </DropdownMenuItem>
          )}
          {done < total && (
            <DropdownMenuItem onClick={() => dispatch(setCompleted({ ids, value: true }))}>
              <CheckCheckIcon /> Отметить всё изученным
            </DropdownMenuItem>
          )}
          {done > 0 && (
            <DropdownMenuItem onClick={() => dispatch(setCompleted({ ids, value: false }))}>
              <Undo2Icon /> Снять отметки «изучено»
            </DropdownMenuItem>
          )}
          {inDeck > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  dispatch(removeCards(ids));
                  toast("Карточки раздела убраны из повторения");
                }}
              >
                <RotateCcwIcon /> Убрать раздел из повторения
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
