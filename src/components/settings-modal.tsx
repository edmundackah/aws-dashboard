"use client";

import * as React from "react";

import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {useTheme} from "next-themes";
import {useDashboardStore} from "@/stores/use-dashboard-store";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import {toast} from "sonner";
import {motion, Variants} from "framer-motion";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}


const cardVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
};

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { clearData, fetchData } = useDashboardStore();
  // burndown settings removed

  const handleClearCache = () => {
    clearData();
    fetchData();
    toast.success("Cache cleared", {
      description: "Dashboard data is being refreshed.",
    });
    onOpenChange(false);
  };

  // using .env targets only; no overrides

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your dashboard preferences and settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Select your preferred interface theme.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                  >
                    Dark
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Clear the local data cache to fetch the latest information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleClearCache}>
                  Clear Cache & Refresh Data
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>
                  Currently configured API endpoints for data retrieval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>Main API:</strong>{" "}
                    <span className="font-mono bg-muted/50 px-2 py-1 rounded">
                      {process.env.NEXT_PUBLIC_API_URL}
                    </span>
                  </p>
                  <p>
                    <strong>Summary API:</strong>{" "}
                    <span className="font-mono bg-muted/50 px-2 py-1 rounded">
                      {process.env.NEXT_PUBLIC_SUMMARY_API_URL}
                    </span>
                  </p>
                  <p>
                    <strong>Burndown API:</strong>{" "}
                    <span className="font-mono bg-muted/50 px-2 py-1 rounded">
                      {process.env.NEXT_PUBLIC_BURNDOWN_API_URL}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
