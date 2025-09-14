"use client";

import { NavigationBar } from "@/components/navigation-bar";
import { ScrollToTop } from "@/components/scroll-to-top";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <NavigationBar />
      {children}
      <ScrollToTop />
    </div>
  );
}
