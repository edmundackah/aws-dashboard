import { TeamsPageClient } from "@/components/teams-page-client";
import { fetchData } from "@/lib/data";
import { ErrorDisplay } from "@/components/error-display";
import logger from "@/lib/logger";
import { metrics } from "@opentelemetry/api";

// Create a meter for page metrics
const meter = metrics.getMeter("aws-dashboard-pages", "1.0.0");
const pageRenderCounter = meter.createCounter("page_renders_total", {
  description: "Total number of page renders",
});

export default async function TeamsPage() {
  logger.info("Rendering teams page");
  pageRenderCounter.add(1, { page: "teams", status: "start" });
  
  const { data, error } = await fetchData();

  if (error) {
    logger.error({ error }, "Error rendering teams page");
    pageRenderCounter.add(1, { page: "teams", status: "error" });
    return <ErrorDisplay message={error} />;
  }

  if (!data) {
    pageRenderCounter.add(1, { page: "teams", status: "no_data" });
    return <ErrorDisplay message="No data available" />;
  }

  pageRenderCounter.add(1, { page: "teams", status: "success" });
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <TeamsPageClient teamsData={data.allTeamStats} />
    </main>
  );
}
