"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useDashboardStore } from "@/stores/use-dashboard-store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { clearData, fetchData } = useDashboardStore();

  const handleClearCache = () => {
    clearData();
    fetchData();
    toast.success("Cache cleared", {
      description: "Dashboard data is being refreshed.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Application Settings</DialogTitle>
          <DialogDescription>
            Manage your dashboard preferences and settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
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
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                >
                  System
                </Button>
              </div>
            </CardContent>
          </Card>

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
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
