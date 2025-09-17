"use client";

import * as React from "react";
import {Check, ChevronsUpDown} from "lucide-react";

import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "@/components/ui/command";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";

interface VersionComboboxProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: string[]; // list of version strings
  placeholder?: string;
  className?: string;
}

export function VersionCombobox({
  value,
  onChange,
  options,
  placeholder = "Select version...",
  className,
}: VersionComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const label = value ?? placeholder;

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
          <CommandInput placeholder="Search version..." />
          <CommandList>
            <CommandEmpty>No versions found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                key="__clear__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <div className="mr-2 h-4 w-4" />
                Clear selection
              </CommandItem>
              {options.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
