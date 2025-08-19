"use client";

import {Badge} from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        <TooltipTrigger asChild>
          <Badge variant="destructive">Not Migrated</Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent || "This service has not been migrated yet."}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}