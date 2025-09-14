"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

interface DepartmentSelectorProps {
  departments: string[];
  value: string | null;
  onChange: (dept: string) => Promise<void> | void;
}

export function DepartmentSelector({ departments, value, onChange }: DepartmentSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const label = value ?? "Select";
  const TriggerIcon = Building2;
  const displayLabel = label.toUpperCase();

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => d.toLowerCase().includes(q));
  }, [departments, query]);

  const handleSelect = async (dept: string) => {
    await onChange(dept);
    setOpen(false);
    setQuery("");
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group relative inline-flex h-10 w-[120px] cursor-pointer items-center justify-between gap-2 overflow-hidden rounded-full border border-border/40",
          "bg-white/10 px-3 text-sm backdrop-blur transition-colors hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select department"
      >
        <span className="pointer-events-none absolute inset-0 rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] bg-primary/20 border-primary/35 dark:bg-primary/20 dark:border-primary/30 opacity-45 group-hover:opacity-65" />
        <span className="flex items-center gap-1.5 truncate">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-background/50">
            <TriggerIcon className="h-3.5 w-3.5" />
          </span>
          <span className="truncate font-medium leading-none">{displayLabel}</span>
        </span>
        <svg className="h-4 w-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute right-0 z-50 mt-2 w-[260px] overflow-hidden rounded-xl border border-border bg-background shadow-xl"
        >
          <div className="p-2">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-md border bg-background/60 px-3 py-2 text-sm outline-none ring-0 focus:border-primary/40"
              />
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
          <ul role="listbox" className="max-h-[240px] overflow-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">No results</li>
            )}
            {filtered.map((d) => {
              const isActive = value === d;
              return (
                <li key={d}>
                  <button
                    type="button"
                    onClick={() => handleSelect(d)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent/50",
                      isActive ? "bg-accent/40" : undefined
                    )}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span className="h-6 w-6 rounded-md bg-muted inline-flex items-center justify-center">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span className="truncate">{d.toUpperCase()}</span>
                    {isActive && (
                      <svg className="ml-auto h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
