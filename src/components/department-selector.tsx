"use client";

import * as React from "react";
import { Building2, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { motion } from "framer-motion";

interface DepartmentSelectorProps {
  departments: string[];
  value: string | null;
  onChange: (dept: string) => Promise<void> | void;
}

export function DepartmentSelector({
  departments,
  value,
  onChange,
}: DepartmentSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = async (dept: string) => {
    await onChange(dept);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="group relative h-10 w-[140px] justify-between rounded-full border-border/40 bg-white/10 px-3 text-sm backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] bg-primary/20 border-primary/35 dark:bg-primary/20 dark:border-primary/30 opacity-45 group-hover:opacity-65"
            initial={false}
            animate={{ opacity: open ? 0.65 : 0.45 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
          <span className="relative flex items-center gap-1.5 truncate">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <span className="truncate font-medium leading-none">
              {(value ?? "Select").toUpperCase()}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0">
        <Command>
          <CommandInput placeholder="Search department..." />
          <CommandList>
            <CommandEmpty>No department found.</CommandEmpty>
            <CommandGroup>
              {departments.map((d) => (
                <CommandItem
                  key={d}
                  value={d}
                  onSelect={() => handleSelect(d)}
                  className="[&_svg]:text-muted-foreground group"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-md inline-flex items-center justify-center transition-colors">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span className="truncate">{d.toUpperCase()}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
