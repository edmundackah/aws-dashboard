import { Microservice, Spa, TeamStat } from "@/app/data/schema";

interface ServiceSummaryItem {
  projectName: string;
  homepage?: string;
  subgroupName: string;
  projectLink: string;
  type: "SPA" | "MICROSERVICE";
  status: "NOT_MIGRATED";
  technicalSme?: {
    name: string;
    email: string;
  };
}

interface MainDataApiResponse {
  spaData: Partial<Spa>[];
  msData: Partial<Microservice>[];
  lastUpdate: string;
}

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

    const mainData: MainDataApiResponse = await mainDataRes.json();
    const summaryData: ServiceSummaryItem[] = await summaryRes.json();

    // Combine migrated and not-migrated data
    const migratedSpas: Spa[] = mainData.spaData.map((spa) => ({
      ...(spa as Spa),
      status: "MIGRATED",
    }));
    const notMigratedSpas: Spa[] = summaryData
      .filter((item) => item.type === "SPA")
      .map((item) => ({
        projectName: item.projectName,
        homepage: item.homepage || "#",
        subgroupName: item.subgroupName,
        projectLink: item.projectLink,
        status: "NOT_MIGRATED",
        environments: { dev: false, sit: false, uat: false, nft: false },
        technicalSme: item.technicalSme,
      }));
    const spaData: Spa[] = [...migratedSpas, ...notMigratedSpas];

    const migratedMs: Microservice[] = mainData.msData.map((ms) => ({
      ...(ms as Microservice),
      status: "MIGRATED",
    }));
    const notMigratedMs: Microservice[] = summaryData
      .filter((item) => item.type === "MICROSERVICE")
      .map((item) => ({
        projectName: item.projectName,
        subgroupName: item.subgroupName,
        projectLink: item.projectLink,
        status: "NOT_MIGRATED",
        otel: "N/A",
        mssdk: "N/A",
        environments: { dev: false, sit: false, uat: false, nft: false },
        technicalSme: item.technicalSme,
      }));
    const msData: Microservice[] = [...migratedMs, ...notMigratedMs];

    const allServices: (Spa | Microservice)[] = [...spaData, ...msData];
    const allTeams = [
      ...new Set(allServices.map((item) => item.subgroupName)),
    ].sort();

    // Calculate all team stats
    const allTeamStats: TeamStat[] = [];
    allTeams.forEach((team) => {
      const teamSpas = spaData.filter((spa) => spa.subgroupName === team);
      const teamMs = msData.filter((ms) => ms.subgroupName === team);

      const teamServices = allServices.filter((s) => s.subgroupName === team);
      const technicalSme = teamServices.length > 0 ? teamServices[0].technicalSme : undefined;

      allTeamStats.push({
        teamName: team,
        migratedSpaCount: teamSpas.filter((s) => s.status === "MIGRATED")
          .length,
        outstandingSpaCount: teamSpas.filter((s) => s.status !== "MIGRATED")
          .length,
        migratedMsCount: teamMs.filter((m) => m.status === "MIGRATED").length,
        outstandingMsCount: teamMs.filter((m) => m.status !== "MIGRATED")
          .length,
        technicalSme,
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
