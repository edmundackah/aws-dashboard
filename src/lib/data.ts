import { Microservice, Spa, TeamStat } from "@/app/data/schema";

export async function getDashboardData() {
  const mainDataUrl = process.env.NEXT_PUBLIC_API_URL;
  const summaryUrl = process.env.NEXT_PUBLIC_SUMMARY_API_URL;

  if (!mainDataUrl || !summaryUrl) {
    throw new Error("API URLs are not defined in the environment variables.");
  }

  try {
    // Fetch both endpoints in parallel
    const [mainDataRes, summaryRes] = await Promise.all([
      fetch(mainDataUrl),
      fetch(summaryUrl),
    ]);

    if (!mainDataRes.ok || !summaryRes.ok) {
      throw new Error("Failed to fetch data from one or more endpoints");
    }

    const mainData = await mainDataRes.json();
    const summaryData = await summaryRes.json();

    // Combine migrated and not-migrated data
    const migratedSpas: Spa[] = mainData.spaData.map((spa: any) => ({
      ...spa,
      status: "MIGRATED",
    }));
    const notMigratedSpas: Spa[] = summaryData
      .filter(
        (item: any) => item.type === "SPA" && item.status === "NOT_MIGRATED",
      )
      .map((item: any) => ({
        projectName: item.projectName,
        homepage: item.homepage || "#",
        subgroupName: item.subgroupName,
        projectLink: item.projectLink,
        status: "NOT_MIGRATED",
        environments: { dev: false, sit: false, uat: false, nft: false },
      }));
    const spaData: Spa[] = [...migratedSpas, ...notMigratedSpas];

    const migratedMs: Microservice[] = mainData.msData.map((ms: any) => ({
      ...ms,
      status: "MIGRATED",
    }));
    const notMigratedMs: Microservice[] = summaryData
      .filter(
        (item: any) =>
          item.type === "MICROSERVICE" && item.status === "NOT_MIGRATED",
      )
      .map((item: any) => ({
        projectName: item.projectName,
        subgroupName: item.subgroupName,
        projectLink: item.projectLink,
        status: "NOT_MIGRATED",
        otel: "N/A",
        mssdk: "N/A",
        environments: { dev: false, sit: false, uat: false, nft: false },
      }));
    const msData: Microservice[] = [...migratedMs, ...notMigratedMs];

    const allServices = [...spaData, ...msData];
    const allTeams = [
      ...new Set(allServices.map((item: any) => item.subgroupName)),
    ].sort();

    // Calculate all team stats
    const allTeamStats: TeamStat[] = [];
    allTeams.forEach((team) => {
      const teamSpas = spaData.filter((spa) => spa.subgroupName === team);
      const teamMs = msData.filter((ms) => ms.subgroupName === team);
      allTeamStats.push({
        teamName: team,
        migratedSpaCount: teamSpas.filter((s) => s.status === "MIGRATED")
          .length,
        outstandingSpaCount: teamSpas.filter((s) => s.status !== "MIGRATED")
          .length,
        migratedMsCount: teamMs.filter((m) => m.status === "MIGRATED").length,
        outstandingMsCount: teamMs.filter((m) => m.status !== "MIGRATED")
          .length,
      });
    });

    return {
      spaData,
      msData,
      allTeams,
      allTeamStats,
      lastUpdate: mainData.lastUpdate,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return empty arrays to prevent the app from crashing
    return {
      spaData: [],
      msData: [],
      allTeams: [],
      allTeamStats: [],
      lastUpdate: "",
    };
  }
}
