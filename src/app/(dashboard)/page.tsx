import { ErrorDisplay } from "@/components/error-display";
import { DashboardPageClient } from "@/components/dashboard/page";
import { getDashboardData } from "@/lib/data";

export default async function Page() {
  try {
    const data = await getDashboardData();
    if (!data || !data.allTeamStats) {
      return <ErrorDisplay message="Could Not Load Dashboard" />;
    }
    return <DashboardPageClient teamsData={data.allTeamStats} />;
  } catch (error) {
    if (error instanceof Error) {
      return <ErrorDisplay message={error.message} />;
    }
    return <ErrorDisplay message="An unknown error occurred" />;
  }
}
