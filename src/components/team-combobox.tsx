"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TeamComboboxProps {
  teams: string[];
  value: string;
  onChange: (value: string) => void;
}

export function TeamCombobox({ teams, value, onChange }: TeamComboboxProps) {
  const [open, setOpen] = React.useState(false)

  // Add "All Teams" to the beginning of the list for selection
  const selectableTeams = ["All Teams", ...teams];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full md:w-[250px] justify-between"
        >
          {value === "all"
            ? "Select a team..."
            : teams.find((team) => team.toLowerCase() === value.toLowerCase())}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search team..." />
          <CommandList>
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup>
              {selectableTeams.map((team) => (
                <CommandItem
                  key={team}
                  value={team}
                  onSelect={(currentValue) => {
                    const newValue = currentValue.toLowerCase() === "all teams" ? "all" : currentValue;
                    onChange(newValue === value ? "all" : newValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      (value === team.toLowerCase() || (value === 'all' && team === 'All Teams'))
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {team}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}