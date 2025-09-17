"use client"

import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion"

export function StatusGuide() {
  return (
    <Accordion type="single" collapsible className="bg-primary/10 border border-primary/20 rounded-lg">
      <AccordionItem value="status-guide">
        <AccordionTrigger className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-1.5 rounded-full">
              <span className="inline-block size-3 rounded-full bg-[hsl(var(--chart-purple))] dark:bg-[hsl(var(--chart-purple)/0.60)]" />
            </div>
            <span className="font-bold text-base text-primary">Status guide</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-block size-2.5 rounded-full bg-[hsl(var(--chart-purple))] dark:bg-[hsl(var(--chart-purple)/0.60)]" />
              <div><span className="font-medium text-primary">Completed</span> — zero remaining achieved by the target date</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block size-2.5 rounded-full bg-[hsl(var(--chart-ms))] dark:bg-[hsl(var(--chart-ms)/0.55)]" />
              <div><span className="font-medium text-primary">On track</span> — projected completion (based on burn rate) is before the target date</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block size-2.5 rounded-full bg-amber-400 dark:bg-amber-300/70" />
              <div><span className="font-medium text-primary">At risk</span> — projected completion exceeds target date or low confidence in projections</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block size-2.5 rounded-full bg-red-500 dark:bg-red-400/70" />
              <div>
                <div><span className="font-medium text-primary">Completed (Late)</span> — zero remaining achieved after the target date</div>
                <div><span className="font-medium text-primary">Target missed</span> — target date passed with items still remaining</div>
              </div>
            </div>
            <div className="pt-2 text-sm text-primary/80 leading-6">
              <div className="mb-1">Status is calculated using linear regression on historical data to project completion dates with confidence scores.</div>
              <div>Dotted lines show planned remaining; solid lines show actual remaining. Two targets per environment: SPA and Microservices.</div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}


