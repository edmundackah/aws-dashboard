"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatusBadgeProps {
  status?: string;
  tooltipContent?: string;
}

export function StatusBadge({ status, tooltipContent }: StatusBadgeProps) {
  if (status !== 'NOT_MIGRATED') {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="destructive">Not Migrated</Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent || "This team has not migrated their services."}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}