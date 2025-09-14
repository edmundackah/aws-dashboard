"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Sun, Laptop2, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const segments = [
  { key: "light", label: "Light", Icon: Sun },
  { key: "system", label: "System", Icon: Laptop2 },
  { key: "dark", label: "Dark", Icon: Moon },
] as const;

type ThemeKey = typeof segments[number]["key"];

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const effectiveTheme: ThemeKey = (theme === "system" ? (systemTheme as ThemeKey) : (theme as ThemeKey)) || "system";
  const activeKey: ThemeKey = (theme as ThemeKey) || "system";

  if (!mounted) {
    return (
      <div className="inline-flex h-10 w-[280px] items-center rounded-full border border-transparent ring-1 ring-black/10 dark:ring-white/15 bg-white/30 dark:bg-white/5 px-1 text-xs backdrop-blur-sm" />
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Theme toggle"
      className={cn(
        "inline-flex h-10 w-[280px] items-center rounded-full border border-transparent px-1 text-xs",
        "ring-1 ring-black/10 bg-white/30 backdrop-blur-sm",
        "dark:ring-white/15 dark:bg-white/5"
      )}
    >
      <motion.div
        layout
        className="relative z-0 flex w-full"
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
      >
        {segments.map((seg) => {
          const selected = activeKey === seg.key;
          return (
            <button
              key={seg.key}
              role="tab"
              aria-selected={selected}
              aria-label={seg.label}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTheme(seg.key)}
              className={cn(
                "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 transition-colors",
                selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <seg.Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{seg.label}</span>
              {selected && (
                <motion.span
                  layoutId="theme-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-primary/15 outline outline-1 outline-black/10 dark:bg-primary/25 dark:outline-white/15"
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                />
              )}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}