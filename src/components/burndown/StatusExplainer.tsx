"use client"

import * as React from "react"
import {Info} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet"

function StatusItems() {
  return (
          <div className="grid gap-3">
        <div className="flex items-center gap-3">
          <span className="ml-2 inline-block size-2.5 rounded-full bg-[hsl(var(--chart-purple))] dark:bg-[hsl(var(--chart-purple)/0.60)]" />
          <div className="text-sm leading-6"><span className="font-medium text-primary">Completed</span> — at least 95% complete by the target date</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="ml-2 inline-block size-2.5 rounded-full bg-[hsl(var(--chart-ms))] dark:bg-[hsl(var(--chart-ms)/0.55)]" />
          <div className="text-sm leading-6"><span className="font-medium text-primary">On track</span> — trend indicates zero remaining by the SPA/MS target dates</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="ml-2 inline-block size-2.5 rounded-full bg-amber-400 dark:bg-amber-300/70" />
          <div className="text-sm leading-6"><span className="font-medium text-primary">At risk</span> — trend/burn rate suggests slipping or close to the target</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="ml-2 inline-block size-2.5 rounded-full bg-red-500 dark:bg-red-400/70" />
          <div className="text-sm leading-6"><span className="font-medium text-primary">Target missed</span> — SPA/MS target passed without reaching zero remaining</div>
        </div>
        <div className="pt-2 text-sm text-primary/80 leading-6">
          Planned vs Actual: Dotted lines show planned remaining; solid lines show actual remaining. Each environment has two targets (SPA and Microservices) which represent zero remaining.
        </div>
      </div>
  )
}

export function StatusExplainer() {
  return (
    <div className="flex items-center justify-between">
      {/* Desktop: Popover */}
      <div className="hidden md:block">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
              <span className="text-sm font-medium">Status & planned vs actual</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(92vw,32rem)] rounded-lg border border-primary/20 bg-card shadow-xl p-4">
            <div className="mb-2 flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                <Info className="h-4 w-4 text-primary" />
              </span>
              <h3 className="text-primary text-base font-bold">How to read this</h3>
            </div>
            <StatusItems />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile: Sheet */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
              <span className="text-sm font-medium">Status & planned vs actual</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl border-primary/20">
            <SheetHeader>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                  <Info className="h-5 w-5 text-primary" />
                </span>
                <SheetTitle className="text-primary">How to read this</SheetTitle>
              </div>
            </SheetHeader>
            <div className="px-4 pb-6">
              <StatusItems />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}


