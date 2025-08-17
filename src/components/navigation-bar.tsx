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
  Clock,
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
  { name: "Burndown", page: "burndown", icon: Clock },
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
      {/* Frosted Glass Navigation Bar */}
      <div className="sticky top-0 z-50 w-full">
        <div className="relative">
          {/* Backdrop blur and glass effect only for nav */}
          <div className="absolute inset-0 bg-background/10 backdrop-blur-md border-b-2 border-border/60" />
          
          {/* Navigation content */}
          <div className="relative flex h-16 items-center gap-6 px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <motion.a
              onClick={() => handleNavigation("overview")}
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary/90 to-primary/70 text-lg font-semibold text-primary-foreground cursor-pointer transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Server className="h-5 w-5 transition-all group-hover:rotate-12" />
              <span className="sr-only">Migration Tracker</span>
            </motion.a>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <motion.a
                  key={item.name}
                  onClick={() => handleNavigation(item.page)}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer rounded-lg",
                    currentPage === item.page
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {item.name}
                  {currentPage === item.page && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 rounded-full"
                      layoutId="underline"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.a>
              ))}
            </nav>

            {/* Search Bar */}
            <div className="flex justify-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Button
                  variant="outline"
                  className="w-full justify-between rounded-xl pl-10 pr-4 h-10 bg-white/5 dark:bg-white/3 border border-border/60 hover:bg-white/10 dark:hover:bg-white/5 hover:border-border transition-all duration-200"
                  onClick={() => setOpen(true)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Search...</span>
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

            {/* Right side actions */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Last Updated */}
              {isMounted && data?.lastUpdate && (
                <motion.div 
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 dark:bg-white/3 rounded-xl border border-border/60 hover:bg-white/10 dark:hover:bg-white/5 hover:border-border transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">Last updated</span>
                    <span className="text-xs text-foreground font-semibold">
                      {formatTimestamp(data.lastUpdate)}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Theme Toggle */}
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
                    className="h-10 w-10 p-0 rounded-xl hover:bg-white/5 dark:hover:bg-white/3 transition-all duration-200 border border-transparent hover:border-white/20 dark:hover:border-white/10"
                    onClick={toggleTheme}
                  >
                    <SunDim className="h-4 w-4" />
                    <MoonStar className="absolute h-4 w-4" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </motion.div>
              )}

              {/* Settings */}
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-xl hover:bg-white/5 dark:hover:bg-white/3 transition-all duration-200 border border-transparent hover:border-white/20 dark:hover:border-white/10"
                onClick={handleSettings}
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Command Modal */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {navItems.map((item) => (
              <CommandItem
                key={item.name}
                value={item.name}
                onSelect={() => handleNavigation(item.page)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
                <CommandShortcut>
                  {isMac ? (
                    <span className="mr-2">⌘</span>
                  ) : (
                    <span className="mr-2">Ctrl</span>
                  )}
                  <span>K</span>
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Export Data">
            <CommandItem
              onSelect={() => handleExport("all")}
            >
              <Download className="mr-2 h-4 w-4" />
              Export All Data
              <CommandShortcut>
                {isMac ? (
                  <span className="mr-2">⌘</span>
                ) : (
                  <span className="mr-2">Ctrl</span>
                )}
                <span>E</span>
              </CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => handleExport("spa")}
            >
              <Download className="mr-2 h-4 w-4" />
              Export SPAs
            </CommandItem>
            <CommandItem
              onSelect={() => handleExport("ms")}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Microservices
            </CommandItem>
            <CommandItem
              onSelect={() => handleExport("teams")}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Teams
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem
              onSelect={handleSettings}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
              <CommandShortcut>
                {isMac ? (
                  <span className="mr-2">⌘</span>
                ) : (
                  <span className="mr-2">Ctrl</span>
                )}
                <span>S</span>
              </CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
    </>
  );
}
