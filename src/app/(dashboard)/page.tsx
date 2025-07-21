import {ErrorDisplay} from "@/components/error-display";
import {DashboardPageClient} from "@/components/dashboard/page";
import { getDashboardData } from "@/lib/data";

export default async function Page() {
  try {
    const data = await getDashboardData();
    if (!data || !data.allTeamStats) {
      return <ErrorDisplay error="Could Not Load Dashboard" description="Please ensure the data source is available and refresh the page." />;
    }
    return <DashboardPageClient teamsData={data.allTeamStats} />;
  } catch (error) {
    if (error instanceof Error) {
      return <ErrorDisplay error={error.message} />;
    }
    return <ErrorDisplay error="An unknown error occurred" />;
  }
}