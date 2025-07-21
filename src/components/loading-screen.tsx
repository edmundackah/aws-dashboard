// components/loading-screen.tsx
import {Loader2} from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading dashboard data...</p>
      </div>
    </div>
  );
}