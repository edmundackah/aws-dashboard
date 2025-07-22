import { Microservice, Spa, TeamStat } from "@/app/data/schema";

export interface ServiceSummaryItem {
  projectName: string;
  homepage?: string;
  subgroupName: string;
  projectLink: string;
  type: "SPA" | "MICROSERVICE";
  status: "MIGRATED" | "NOT_MIGRATED";
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

  const smeMap = new Map<string, ServiceSummaryItem["technicalSme"]>();
  if (summaryData) {
    summaryData.forEach((item) => {
      if (item.technicalSme) {
        smeMap.set(item.projectName, item.technicalSme);
      }
    });
  }

  const migratedSpas: Spa[] = mainData.spaData.map((spa) => ({
    ...(spa as Spa),
    status: "MIGRATED",
    technicalSme: smeMap.get(spa.projectName!),
  }));
  const migratedSpaNames = new Set(migratedSpas.map((s) => s.projectName));
  const notMigratedSpas: Spa[] = summary
    .filter(
      (item) =>
        item.type === "SPA" &&
        item.status === "NOT_MIGRATED" &&
        !migratedSpaNames.has(item.projectName),
    )
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
    technicalSme: smeMap.get(ms.projectName!),
  }));
  const migratedMsNames = new Set(migratedMs.map((m) => m.projectName));
  const notMigratedMs: Microservice[] = summary
    .filter(
      (item) =>
        item.type === "MICROSERVICE" &&
        item.status === "NOT_MIGRATED" &&
        !migratedMsNames.has(item.projectName),
    )
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
    const serviceWithSme = teamServices.find(
      (s) => s.technicalSme && s.technicalSme.name !== "N/A",
    );
    const technicalSme = serviceWithSme?.technicalSme;

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
