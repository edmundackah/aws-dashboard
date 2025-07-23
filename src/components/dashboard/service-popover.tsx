"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spa, Microservice } from "@/app/data/schema";

interface ServicePopoverProps {
  teamName: string;
  serviceType: "SPA" | "Microservice";
  status: "Migrated" | "Outstanding";
  count: number;
  services: (Spa | Microservice)[];
  children: React.ReactNode;
}

export function ServicePopover({
  teamName,
  status,
  count,
  services,
  children,
}: ServicePopoverProps) {
  if (count === 0) {
    return <>{children}</>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">
              {teamName}
            </h4>
            <p className="text-sm text-muted-foreground">
              A list of services that are in the {status.toLowerCase()} state.
            </p>
          </div>
          <div className="grid gap-2 max-h-60 overflow-y-auto">
            {services.map((service, index) => (
              <div key={index} className="grid grid-cols-[25px_1fr] items-start">
                <span className="text-sm font-bold">{index + 1}.</span>
                <a
                  href={service.projectLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {service.projectName}
                </a>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 