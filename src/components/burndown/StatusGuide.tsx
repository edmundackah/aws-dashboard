"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function StatusGuide() {
  return (
    <Accordion type="single" collapsible className="rounded-md border border-border/60 bg-muted/30">
      <AccordionItem value="status-guide">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
            <span>Status guide</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-2">
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
              <div><span className="font-medium text-foreground">Completed</span> — at least 95% complete by the target date</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
              <div><span className="font-medium text-foreground">On track</span> — projection indicates completion by the target date</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
              <div><span className="font-medium text-foreground">At risk</span> — trend/burn rate suggests slipping or close to the target</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" />
              <div><span className="font-medium text-foreground">Target missed</span> — target passed and less than 95% complete (shown on charts)</div>
            </div>
            <div className="pt-2 text-xs text-muted-foreground leading-6">
              Projection logic: Dotted values bridge from the last known point to the projected end date using a few evenly-spaced points so it appears smooth. If that end date is past the target, the chart shows “Target missed”.
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}


