"use client";

import { NavigationBar } from "@/components/navigation-bar";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <NavigationBar />
      <main className="flex-1 flex flex-col p-4 pt-6">
        {children}
      </main>
      <ScrollToTop />
    </div>
  );
}
