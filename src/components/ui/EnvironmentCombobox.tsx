"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EnvironmentDropdownProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  includeAllOption?: boolean;
}

const environments = ["dev", "sit", "uat", "nft"];

export function EnvironmentCombobox({
  value,
  onChange,
  className,
  includeAllOption = true,
}: EnvironmentDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const label = value === "all" ? "All Environments" : value ? value.toUpperCase() : "Select environment";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[240px] justify-between", className)}
        >
          {label}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search environment..." />
          <CommandList>
            <CommandEmpty>No environment found.</CommandEmpty>
            <CommandGroup>
              {includeAllOption && (
                <CommandItem
                  key="all"
                  value="All Environments"
                  onSelect={() => {
                    onChange("all");
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === "all" ? "opacity-100" : "opacity-0")} />
                  All Environments
                </CommandItem>
              )}
              {environments.map((env) => (
                <CommandItem
                  key={env}
                  value={env.toUpperCase()}
                  onSelect={() => {
                    onChange(env);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === env ? "opacity-100" : "opacity-0")} />
                  {env.toUpperCase()}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
