"use client";

import { NavigationBar } from "@/components/navigation-bar";
import { ScrollToTop } from "@/components/scroll-to-top";
import { useDashboardStore } from "@/stores/use-dashboard-store";
import OverviewPage from "./page";
import SpasPage from "./spas/page";
import MicroservicesPage from "./microservices/page";
import TeamsPage from "./teams/page";
import { BurndownPageClient } from "@/components/burndown-page-client";

const pageComponents = {
  overview: <OverviewPage />,
  spas: <SpasPage />,
  microservices: <MicroservicesPage />,
  teams: <TeamsPage />,
  burndown: (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <BurndownPageClient />
    </main>
  ),
};

const PageRenderer = () => {
  const { currentPage } = useDashboardStore();
  return pageComponents[currentPage] || <OverviewPage />;
};

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <NavigationBar />
      <main className="flex-1 flex flex-col p-4 pt-6">
        <PageRenderer />
      </main>
      <ScrollToTop />
    </div>
  );
}
