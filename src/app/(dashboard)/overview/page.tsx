import { ErrorDisplay } from "@/components/error-display";
import { DashboardPageClient } from "@/components/dashboard/page";
import { fetchData } from "@/lib/data";
import logger from "@/lib/logger";
import { incrementPageRenders } from "@/lib/metrics-collector";

export default async function Page() {
  logger.info("Rendering overview page", {
    page: "overview",
    timestamp: new Date().toISOString(),
    renderType: "server-side"
  });
  incrementPageRenders("overview", "start");
  
  const { data, error } = await fetchData();

  if (error) {
    logger.error({ error }, "Error rendering overview page");
    incrementPageRenders("overview", "error");
    return <ErrorDisplay message={error} />;
  }

  if (!data) {
    logger.warn("No data available for overview page");
    incrementPageRenders("overview", "no_data");
    return <ErrorDisplay message="No data available" />;
  }

  logger.info("Overview page rendered successfully", {
    teamsCount: data.allTeamStats?.length || 0
  });
  incrementPageRenders("overview", "success");
  return <DashboardPageClient teamsData={data.allTeamStats} />;
}
