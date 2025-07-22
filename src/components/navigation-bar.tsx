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
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDashboardStore } from "@/stores/use-dashboard-store";
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
];

export function NavigationBar() {
  const [open, setOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data } = useDashboardStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  const handleNavigation = (path: string) => {
    router.push(path);
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

  const isMac =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const cmdKey = isMac ? "⌘" : "Ctrl";

  return (
    <>
      <div className="relative flex-col md:flex w-full">
        <div className="flex h-14 items-center gap-6 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Link
            href="/"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Server className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">Migration Tracker</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary relative",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {item.name}
                {pathname === item.href && (
                  <motion.div
                    className="absolute bottom-[-4px] left-0 right-0 h-[2px] bg-primary"
                    layoutId="underline"
                  />
                )}
              </Link>
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
                  <Command className="h-3 w-3" />
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
                  onSelect={() => handleNavigation(item.href)}
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
                <CommandShortcut>{cmdKey}E</CommandShortcut>
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
                <CommandShortcut>{cmdKey}S</CommandShortcut>
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
