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
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useDashboardStore } from "@/stores/use-dashboard-store";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { LastUpdatedIndicator } from "@/components/last-updated";
import { useMemo } from "react";
import { DepartmentSelector } from "@/components/department-selector";

const navItems = [
  {
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  { name: "SPAs", href: "/spas", icon: Grid },
  {
    name: "Microservices",
    href: "/microservices",
    icon: Server,
  },
  { name: "Teams", href: "/teams", icon: User },
  { name: "Burndown", href: "/burndown", icon: Command },
] as const;

export function NavigationBar() {
  const [open, setOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const {
    data,
    fetchData,
    departments,
    selectedDepartment,
    setDepartment,
    initializeDepartment,
  } = useDashboardStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize department once on mount
  useEffect(() => {
    const deptFromUrl = searchParams.get("department");
    const deptFromStorage = localStorage.getItem("selectedDepartment");
    const defaultDept = departments.length > 0 ? departments[0] : "";

    let initialDept = defaultDept;
    if (deptFromUrl && departments.includes(deptFromUrl)) {
      initialDept = deptFromUrl;
    } else if (deptFromStorage && departments.includes(deptFromStorage)) {
      initialDept = deptFromStorage;
    }
    
    initializeDepartment(initialDept);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  // Sync state changes to URL
  useEffect(() => {
    if (selectedDepartment) {
      const params = new URLSearchParams(searchParams);
      if (params.get("department") !== selectedDepartment) {
        params.set("department", selectedDepartment);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    }
  }, [selectedDepartment, pathname, router, searchParams]);

  const deptLabel = useMemo(() => selectedDepartment || "Select department", [selectedDepartment]);
  const [isMounted, setIsMounted] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)
  const dockRef = useRef<HTMLDivElement | null>(null)
  const dockItemRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [dockPill, setDockPill] = useState<{ left: number; width: number } | null>(null)

  useEffect(() => {
    setIsMounted(true);
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  // Measure active tab for animated pill
  useLayoutEffect(() => {
    const activeKey = navItems.find((n) => n.href === pathname)?.href ?? "/";
    const activeEl = itemRefs.current[activeKey]
    const container = navRef.current
    if (activeEl && container) {
      const rect = activeEl.getBoundingClientRect()
      const parentRect = container.getBoundingClientRect()
      const next = { left: rect.left - parentRect.left, width: rect.width }
      setPill(next)
    }
  }, [pathname])

  useLayoutEffect(() => {
    const activeKey = navItems.find((n) => n.href === pathname)?.href ?? "/";
    const activeEl = dockItemRefs.current[activeKey]
    const container = dockRef.current
    if (activeEl && container) {
      const rect = activeEl.getBoundingClientRect()
      const parentRect = container.getBoundingClientRect()
      const next = { left: rect.left - parentRect.left, width: rect.width }
      setDockPill(next)
    }
  }, [pathname])

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

  const handleNavigation = (href: string) => {
    router.push(href);
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

  const handleRefresh = async () => {
    await fetchData();
  };

  return (
    <>
      {/* Frosted Glass Navigation Bar */}
      <div className="sticky top-0 z-50 w-full">
        <div className="relative">
          {/* Glass + subtle gradient + noise overlay */}
          <div className="absolute inset-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 border-b border-border/60" />
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(1200px_circle_at_10%_-20%,hsl(var(--primary)/.08),transparent_40%),radial-gradient(1000px_circle_at_90%_-10%,hsl(var(--primary)/.06),transparent_40%)]" />
          
          {/* Navigation content */}
          <div className="relative flex h-16 items-center gap-6 px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <motion.a
              onClick={() => handleNavigation("/")}
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary/90 to-primary/70 text-lg font-semibold text-primary-foreground cursor-pointer transition-all duration-300 hover:scale-105 shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Server className="h-5 w-5 transition-all group-hover:rotate-12" />
              <span className="sr-only">Migration Tracker</span>
            </motion.a>

            {/* Navigation Links with animated pill */}
            <nav ref={navRef} className="relative hidden md:flex items-center gap-1">
              {pill && (
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 h-9 rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] bg-primary/15 border-primary/25 dark:bg-white/12 dark:border-white/15 pointer-events-none"
                  style={{ left: 0, width: 0, zIndex: 0 }}
                  animate={{ left: pill.left, width: pill.width }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                />
              )}
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <motion.a
                    key={item.name}
                    ref={(el) => { itemRefs.current[item.href] = el }}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "relative z-10 px-3.5 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer rounded-xl",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {item.name}
                  </motion.a>
                )
              })}
            </nav>

            {/* Search Bar */}
            <div className="hidden md:flex justify-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Button
                  variant="outline"
                  className="group relative w-full justify-between rounded-full pl-10 pr-4 h-10 bg-white/10 dark:bg-white/5 border border-border/40 hover:bg-white/20 dark:hover:bg-white/10 hover:border-border transition-all duration-200 backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  onClick={() => setOpen(true)}
                >
                  <motion.span
                    className="absolute inset-0 rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] bg-primary/20 border-primary/35 dark:bg-primary/20 dark:border-primary/30 opacity-45 group-hover:opacity-65"
                    initial={false}
                    animate={{ opacity: open ? 0.9 : undefined }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
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
              {/* Department Selector */}
              {isMounted && departments.length > 0 && (
                <DepartmentSelector
                  departments={departments}
                  value={selectedDepartment}
                  onChange={setDepartment}
                />
              )}
              {/* Last Updated */}
              {isMounted && data?.lastUpdate && (
                <LastUpdatedIndicator lastUpdate={data.lastUpdate} onRefresh={handleRefresh} />
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
                    className="h-10 w-10 p-0 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200 border border-white/10"
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
                className="h-10 w-10 p-0 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200 border border-white/10"
                onClick={handleSettings}
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Glass Dock */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div ref={dockRef} className="relative flex items-center gap-1 rounded-2xl border border-border/50 bg-white/10 dark:bg-black/20 backdrop-blur-xl px-2 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
          {dockPill && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 h-10 rounded-xl bg-primary/20 border border-primary/25 dark:bg-white/12 dark:border-white/15 pointer-events-none"
              style={{ left: 0, width: 0 }}
              animate={{ left: dockPill.left, width: dockPill.width }}
              initial={false}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
            />
          )}
          {navItems.map((item) => {
            const ActiveIcon = item.icon
            const isActive = pathname === item.href
            return (
              <motion.button
                key={item.name}
                ref={(el) => { dockItemRefs.current[item.href] = el }}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "relative mx-1 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors z-10",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                whileTap={{ scale: 0.96 }}
              >
                <ActiveIcon className="h-5 w-5" />
              </motion.button>
            )
          })}
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
                onSelect={() => handleNavigation(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
                <CommandShortcut>
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
