// components/dashboard/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { SummaryCard } from "@/components/SummaryCard";
import { Spa, Microservice, TeamStat } from "@/app/data/schema"; // Import TeamStat

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingScreen } from "@/components/loading-screen";

import { columns as spaColumns } from "./spa-columns";
import { columns as msColumns } from "./ms-columns";
import { columns as teamStatsColumns } from "./team-stats-columns"; // Import new columns
import { DataTable } from "./data-table";

export function DashboardPage() {
  // State for data, filters, and loading
  const [spaData, setSpaData] = useState<Spa[]>([]);
  const [msData, setMsData] = useState<Microservice[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [globalFilter, setGlobalFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 750));
        const response = await fetch('http://localhost:8084/dashboard_data.json');
        const data = await response.json();
        setSpaData(data.spaData);
        setMsData(data.msData);
        setLastUpdated(data.lastUpdate);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Memoize calculations for performance
  const { allTeams, filteredSpaData, filteredMsData, teamStats } = useMemo(() => {
    const teams = [...new Set([...spaData.map(item => item.subgroupName), ...msData.map(item => item.subgroupName)])].sort();

    // Helper for the global search filter
    const filterByGlobal = (data: any[]) => {
      if (!globalFilter) return data;
      const searchStr = globalFilter.toLowerCase();
      return data.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchStr)
        ) || (item.environments && JSON.stringify(item.environments).toLowerCase().includes(searchStr))
      );
    };

    // Filter SPA and MS data by team first, then by global search
    const fSpaData = spaData.filter(item => teamFilter === 'all' || item.subgroupName === teamFilter);
    const fMsData = msData.filter(item => teamFilter === 'all' || item.subgroupName === teamFilter);

    // Calculate team stats
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

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Header lastUpdated={lastUpdated} />
      <main className="container mx-auto py-8">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <SummaryCard title="SPAs Migrated" value={spaData.length} />
          <SummaryCard title="Microservices Migrated" value={msData.length} />
          {/* Teams card is now a simple display, no longer a button */}
          <SummaryCard title="Teams Migrating" value={allTeams.length} />
        </div>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-2 mb-6 items-end">
          <div>
            <label htmlFor="team-select" className="text-sm font-medium mb-2 block">Filter by Team:</label>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger id="team-select" className="w-full md:w-[250px]">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {allTeams.map(team => (
                  <SelectItem key={team} value={team}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="global-search" className="text-sm font-medium mb-2 block">Global Search:</label>
            <div className="flex gap-2">
              <Input
                id="global-search"
                placeholder="Search all projects, teams, etc..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="flex-grow"
              />
              <Button variant="outline" onClick={() => {setGlobalFilter(""); setTeamFilter("all")}}>Clear</Button>
            </div>
          </div>
        </div>

        {/* Tabs with new "Teams" tab */}
        <Tabs defaultValue="spa" className="w-full">
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