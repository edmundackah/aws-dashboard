"use client";

import { Header } from "@/components/Header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/footer";
import { useDashboardStore } from "@/stores/use-dashboard-store";
import OverviewPage from "./page";
import SpasPage from "./spas/page";
import MicroservicesPage from "./microservices/page";
import TeamsPage from "./teams/page";

const pageComponents = {
  overview: <OverviewPage />,
  spas: <SpasPage />,
  microservices: <MicroservicesPage />,
  teams: <TeamsPage />,
};

const PageRenderer = () => {
  const { currentPage } = useDashboardStore();
  return pageComponents[currentPage] || <OverviewPage />;
};

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4">
      <Header />
      <Separator className="my-4" />
      <main className="flex-1 flex flex-col min-h-0">
        <PageRenderer />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
