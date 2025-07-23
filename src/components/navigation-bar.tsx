"use client";

import { Button } from "./ui/button";
import {
  Search,
  Settings,
  User,
  SunDim,
  MoonStar,
  Server,
  Grid,
  LayoutDashboard,
  Command,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useDashboardStore, Page } from "@/stores/use-dashboard-store";
import { exportData } from "@/lib/export-utils";
import { toast } from "sonner";
import { SettingsModal } from "@/components/settings-modal";
import {
  Command as CommandPrimitive,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./ui/command";

const navItems = [
  {
    name: "Overview",
    page: "overview",
    icon: LayoutDashboard,
  },
  { name: "SPAs", page: "spas", icon: Grid },
  {
    name: "Microservices",
    page: "microservices",
    icon: Server,
  },
  { name: "Teams", page: "teams", icon: User },
] as const;

export function NavigationBar() {
  const [open, setOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data, currentPage, setCurrentPage } = useDashboardStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  const formatTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "e" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleExport("all");
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    setOpen(false);
  };

  const handleExport = async (type: "spa" | "ms" | "teams" | "all") => {
    await exportData(type);
    toast.success(
      `Successfully exported ${
        type === "ms" ? "microservices" : type
      } data.`,
    );
    setOpen(false);
  };

  const handleSettings = () => {
    setIsSettingsModalOpen(true);
    setOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <>
      <div className="relative flex-col md:flex w-full">
        <div className="flex h-14 items-center gap-6 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <a
            onClick={() => handleNavigation("overview")}
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base cursor-pointer"
          >
            <Server className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">Migration Tracker</span>
          </a>
          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <a
                key={item.name}
                onClick={() => handleNavigation(item.page)}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary relative cursor-pointer",
                  currentPage === item.page
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {item.name}
                {currentPage === item.page && (
                  <motion.div
                    className="absolute bottom-[-4px] left-0 right-0 h-[2px] bg-primary"
                    layoutId="underline"
                  />
                )}
              </a>
            ))}
          </nav>
          <div className="flex justify-center flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Button
                variant="outline"
                className="w-full justify-between rounded-lg pl-8"
                onClick={() => setOpen(true)}
              >
                <div className="flex items-center gap-2">
                  <span>Search...</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {isMac ? (
                    <Command className="h-3 w-3" />
                  ) : (
                    <span className="rounded-sm border border-input bg-muted px-1.5 py-0.5 text-xs">
                      Ctrl
                    </span>
                  )}
                  <span>K</span>
                </div>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {isMounted && data?.lastUpdate && (
              <div className="text-sm text-muted-foreground">
                Last updated: {formatTimestamp(data.lastUpdate)}
              </div>
            )}
            {isMounted && (
              <motion.div
                initial={false}
                animate={theme === "light" ? "light" : "dark"}
                variants={{
                  light: { rotate: 0 },
                  dark: { rotate: 180 },
                }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-muted/50 transition-all"
                  onClick={toggleTheme}
                >
                  <SunDim className="h-4 w-4" />
                  <MoonStar className="absolute h-4 w-4" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandPrimitive className="rounded-lg border shadow-md">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              {navItems.map((item) => (
                <CommandItem
                  key={item.name}
                  onSelect={() => handleNavigation(item.page)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Export Data">
              <CommandItem onSelect={() => handleExport("all")}>
                <Download className="mr-2 h-4 w-4" />
                <span>Export All Data</span>
                <CommandShortcut platform={isMac ? "mac" : "windows"}>
                  E
                </CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => handleExport("spa")}>
                <Download className="mr-2 h-4 w-4" />
                <span>Export SPAs</span>
              </CommandItem>
              <CommandItem onSelect={() => handleExport("ms")}>
                <Download className="mr-2 h-4 w-4" />
                <span>Export Microservices</span>
              </CommandItem>
              <CommandItem onSelect={() => handleExport("teams")}>
                <Download className="mr-2 h-4 w-4" />
                <span>Export Teams</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem onSelect={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <CommandShortcut platform={isMac ? "mac" : "windows"}>
                  S
                </CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandPrimitive>
      </CommandDialog>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
    </>
  );
}
