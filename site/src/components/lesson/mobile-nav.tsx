"use client";

import { useState } from "react";
import { PanelLeftIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <PanelLeftIcon /> Содержание раздела
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] gap-0 p-0 sm:max-w-sm">
        <SheetTitle className="sr-only">Содержание раздела</SheetTitle>
        <div className="h-full min-h-0" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
