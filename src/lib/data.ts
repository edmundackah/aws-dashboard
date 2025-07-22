import { Microservice, Spa, TeamStat } from "@/app/data/schema";

export interface ServiceSummaryItem {
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

export interface MainDataApiResponse {
  spaData: Partial<Spa>[];
  msData: Partial<Microservice>[];
  lastUpdate: string;
}

// This is the function that will do all the data processing and combining.
// It can be called with just the main data, or with both main and summary data.
export function processDashboardData(
  mainData: MainDataApiResponse,
  summaryData?: ServiceSummaryItem[],
): {
  spaData: Spa[];
  msData: Microservice[];
  allTeams: string[];
  allTeamStats: TeamStat[];
  lastUpdate: string;
} {
  const summary = summaryData || [];

  const migratedSpas: Spa[] = mainData.spaData.map((spa) => ({
    ...(spa as Spa),
    status: "MIGRATED",
  }));
  const notMigratedSpas: Spa[] = summary
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
  const notMigratedMs: Microservice[] = summary
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

  const allTeamStats: TeamStat[] = [];
  allTeams.forEach((team) => {
    const teamSpas = spaData.filter((spa) => spa.subgroupName === team);
    const teamMs = msData.filter((ms) => ms.subgroupName === team);
    const teamServices = allServices.filter((s) => s.subgroupName === team);
    const serviceWithSme = teamServices.find((s) => s.technicalSme);
    const technicalSme = serviceWithSme
      ? serviceWithSme.technicalSme
      : undefined;

    const migratedSpaCount = teamSpas.filter(
      (s) => s.status === "MIGRATED",
    ).length;
    const migratedMsCount = teamMs.filter(
      (m) => m.status === "MIGRATED",
    ).length;

    allTeamStats.push({
      teamName: team,
      migratedSpaCount,
      outstandingSpaCount: summaryData
        ? teamSpas.filter((s) => s.status !== "MIGRATED").length
        : 0,
      migratedMsCount,
      outstandingMsCount: summaryData
        ? teamMs.filter((m) => m.status !== "MIGRATED").length
        : 0,
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
}
