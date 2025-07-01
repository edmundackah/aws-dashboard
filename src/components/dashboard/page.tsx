"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { SummaryCard } from "@/components/SummaryCard";
import { Spa, Microservice, TeamStat } from "@/app/data/schema";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TeamCombobox } from "@/components/team-combobox";
import { MigrationBanner } from "@/components/migration-banner";
import { ExportButton } from "@/components/export-button";

import { columns as spaColumns } from "./spa-columns";
import { columns as msColumns } from "./ms-columns";
import { columns as teamStatsColumns } from "./team-stats-columns";
import { DataTable } from "./data-table";

// Define the interface for the props this component will receive
interface DashboardPageProps {
  data: {
    spaData: Spa[];
    msData: Microservice[];
    lastUpdate: string;
  };
}

// Ensure the component accepts and destructures the props correctly
export function DashboardPage({ data }: DashboardPageProps) {
  const { spaData, msData, lastUpdate } = data;

  const [globalFilter, setGlobalFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("ms");

  const { allTeams, filteredSpaData, filteredMsData, teamStats } = useMemo(() => {
    const teams = [...new Set([...spaData.map(item => item.subgroupName), ...msData.map(item => item.subgroupName)])].sort();

    const filterByGlobal = <T extends Spa | Microservice>(data: T[]): T[] => {
      if (!globalFilter) return data;
      const searchStr = globalFilter.toLowerCase();
      return data.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchStr)
        ) || (item.environments && JSON.stringify(item.environments).toLowerCase().includes(searchStr))
      );
    };

    const fSpaData = spaData.filter(item => teamFilter === 'all' || item.subgroupName.toLowerCase() === teamFilter.toLowerCase());
    const fMsData = msData.filter(item => teamFilter === 'all' || item.subgroupName.toLowerCase() === teamFilter.toLowerCase());

    const stats: { [key: string]: TeamStat } = {};
    teams.forEach(team => {
      stats[team] = { teamName: team, spaCount: 0, msCount: 0 };
    });
    spaData.forEach(spa => {
      if (stats[spa.subgroupName]) stats[spa.subgroupName].spaCount++;
    });
    msData.forEach(ms => {
      if (stats[ms.subgroupName]) stats[ms.subgroupName].msCount++;
    });

    return {
      allTeams: teams,
      filteredSpaData: filterByGlobal(fSpaData),
      filteredMsData: filterByGlobal(fMsData),
      teamStats: Object.values(stats),
    };
  }, [spaData, msData, teamFilter, globalFilter]);

  const summaryCards = [
    { title: "SPAs Migrated", value: spaData.length },
    { title: "Microservices Migrated", value: msData.length },
    { title: "Teams Migrating", value: allTeams.length },
  ];

  return (
    <>
      <Header lastUpdated={lastUpdate} />
      <main className="container mx-auto py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {summaryCards.map((card, index) => (
            <SummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              index={index}
            />
          ))}
        </div>

        <MigrationBanner />

        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
          <div>
            <label htmlFor="team-select" className="text-sm font-medium mb-2 block">Filter by Team:</label>
            <TeamCombobox teams={allTeams} value={teamFilter} onChange={setTeamFilter} />
          </div>

          <div className="flex-grow">
            <label htmlFor="global-search" className="text-sm font-medium mb-2 block">Global Search:</label>
            <div className="flex gap-2">
              <Input
                id="global-search"
                placeholder="Search all projects, teams, etc..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="flex-grow"
              />
              <Button
                variant="outline"
                onClick={() => {setGlobalFilter(""); setTeamFilter("all")}}
              >
                Clear
              </Button>
              <ExportButton
                activeTab={activeTab}
                spaData={filteredSpaData}
                msData={filteredMsData}
                teamStats={teamStats}
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="ms" className="w-full" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="spa">SPAs</TabsTrigger>
            <TabsTrigger value="ms">Microservices</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>
          <TabsContent value="spa">
            <DataTable columns={spaColumns} data={filteredSpaData} />
          </TabsContent>
          <TabsContent value="ms">
            <DataTable columns={msColumns} data={filteredMsData} />
          </TabsContent>
          <TabsContent value="teams">
            <DataTable columns={teamStatsColumns} data={teamStats} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}