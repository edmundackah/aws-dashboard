"use client";

import * as React from "react";
import {Check, ChevronsUpDown} from "lucide-react";

import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "@/components/ui/command";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";

export type StatusValue = "all" | "migrated" | "not_migrated";

const STATUS_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: "all", label: "Show All" },
  { value: "migrated", label: "Migrated" },
  { value: "not_migrated", label: "Not Migrated" },
];

interface StatusComboboxProps {
  value: StatusValue;
  onChange: (value: StatusValue) => void;
  placeholder?: string;
  className?: string;
}

export function StatusCombobox({
  value,
  onChange,
  placeholder = "Select status...",
  className,
}: StatusComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const active = STATUS_OPTIONS.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[240px] justify-between", className)}
        >
          {active}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search status..." />
          <CommandList>
            <CommandEmpty>No status found.</CommandEmpty>
            <CommandGroup>
              {STATUS_OPTIONS.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
