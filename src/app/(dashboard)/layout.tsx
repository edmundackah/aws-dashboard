"use client";

import {NavigationBar} from "@/components/navigation-bar";
import {ScrollToTop} from "@/components/scroll-to-top";
import {ReactNode, Suspense} from "react";
import { LoadingScreen } from "@/components/loading-screen";
 

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Suspense fallback={null}>
        <NavigationBar />
      </Suspense>
      <Suspense fallback={<LoadingScreen />}>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-4 md:gap-8">
          {children}
        </main>
      </Suspense>
      <ScrollToTop />
    </div>
  );
}
