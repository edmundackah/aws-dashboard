"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function StatusGuide() {
  return (
    <Accordion type="single" collapsible className="bg-primary/10 border border-primary/20 rounded-lg">
      <AccordionItem value="status-guide">
        <AccordionTrigger className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-1.5 rounded-full">
              <span className="inline-block h-3 w-3 rounded-sm bg-green-500" />
            </div>
            <span className="font-bold text-base text-primary">Status guide</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
              <div><span className="font-medium text-primary">Completed</span> — at least 95% complete by the target date</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
              <div><span className="font-medium text-primary">On track</span> — projection indicates completion by the target date</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
              <div><span className="font-medium text-primary">At risk</span> — trend/burn rate suggests slipping or close to the target</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" />
              <div><span className="font-medium text-primary">Target missed</span> — target passed and less than 95% complete (shown on charts)</div>
            </div>
            <div className="pt-2 text-sm text-primary/80 leading-6">
              Projection logic: Dotted values bridge from the last known point to the projected end date using a few evenly-spaced points so it appears smooth. If that end date is past the target, the chart shows “Target missed”.
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}


