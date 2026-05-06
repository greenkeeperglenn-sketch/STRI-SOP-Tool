"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import type { SessionUser } from "@/lib/types";

interface HeaderProps {
  user: SessionUser;
  title?: string;
}

export function Header({ user, title }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        {title && (
          <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <Sidebar user={user} onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
