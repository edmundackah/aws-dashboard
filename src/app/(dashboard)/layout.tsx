"use client";

import {NavigationBar} from "@/components/navigation-bar";
import {ScrollToTop} from "@/components/scroll-to-top";
import {ReactNode, Suspense} from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { TutorialOverlay } from "@/components/tutorial-overlay";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Suspense fallback={null}>
        <NavigationBar />
      </Suspense>
      <Suspense fallback={<LoadingScreen />}>
        <TutorialOverlay />
        <main className="flex-1 flex flex-col p-4 pt-6">
          {children}
        </main>
      </Suspense>
      <ScrollToTop />
    </div>
  );
}
