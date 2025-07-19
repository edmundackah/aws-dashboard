"use client";

import { useState, useMemo, Suspense } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Header } from "@/components/Header";
import { SummaryCard } from "@/components/summary-card";
import { Spa, Microservice, TeamStat } from "@/app/data/schema";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamCombobox } from "@/components/team-combobox";
import { MigrationBanner } from "@/components/migration-banner";
import { ExportButton } from "@/components/export-button";

import { columns as spaColumns } from "./spa-columns";
import { columns as msColumns } from "./ms-columns";
import { columns as teamStatsColumns } from "./team-stats-columns";
import {DataTable} from "@/components/dashboard/data-table";

const TableSkeleton = () => (
  <div className="space-y-2 pt-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
);

const tabOrder = ["spa", "ms", "teams"];

const slideVariants: Variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    position: 'absolute',
  }),
  animate: {
    x: 0,
    opacity: 1,
    position: 'relative',
    transition: { type: "spring", stiffness: 260, damping: 30 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
    position: 'absolute',
    transition: { type: "spring", stiffness: 260, damping: 30 },
  }),
};

interface DashboardPageProps {
  data: {
    spaData: Spa[];
    msData: Microservice[];
    lastUpdate: string;
  };
}

export function DashboardPage({ data }: DashboardPageProps) {
  const { spaData, msData, lastUpdate } = data;

  const [globalFilter, setGlobalFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("ms");
  const [direction, setDirection] = useState(0);

  const handleTabChange = (newTab: string) => {
    const oldIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(newTab);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  const { allTeams, filteredSpaData, filteredMsData, teamStats, summaryStats } = useMemo(() => {
    const allServices = [...spaData, ...msData];
    const teams = [...new Set(allServices.map(item => item.subgroupName))].sort();

    const filterByGlobal = <T extends Spa | Microservice>(data: T[]): T[] => {
      if (!globalFilter) return data;
      const searchStr = globalFilter.toLowerCase();
      return data.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchStr)
        ) || (item.environments && JSON.stringify(item.environments).toLowerCase().includes(searchStr))
      );
    };

    const statusFilteredSpas = spaData.filter(item => {
      if (statusFilter === 'all') return true;
      return item.status?.toLowerCase().replace('_', '') === statusFilter.replace('_', '');
    });

    const statusFilteredMs = msData.filter(item => {
      if (statusFilter === 'all') return true;
      return item.status?.toLowerCase().replace('_', '') === statusFilter.replace('_', '');
    });

    const fSpaData = statusFilteredSpas.filter(item => teamFilter === 'all' || item.subgroupName.toLowerCase() === teamFilter.toLowerCase());
    const fMsData = statusFilteredMs.filter(item => teamFilter === 'all' || item.subgroupName.toLowerCase() === teamFilter.toLowerCase());

    const calculatedTeamStats: TeamStat[] = [];
    teams.forEach(team => {
      const teamSpas = spaData.filter(spa => spa.subgroupName === team);
      const teamMs = msData.filter(ms => ms.subgroupName === team);

      calculatedTeamStats.push({
        teamName: team,
        migratedSpaCount: teamSpas.filter(s => s.status === 'MIGRATED').length,
        outstandingSpaCount: teamSpas.filter(s => s.status !== 'MIGRATED').length,
        migratedMsCount: teamMs.filter(m => m.status === 'MIGRATED').length,
        outstandingMsCount: teamMs.filter(m => m.status !== 'MIGRATED').length,
      });
    });

    const filteredTeamStats = calculatedTeamStats.filter(team => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'migrated') {
        return team.outstandingSpaCount === 0 && team.outstandingMsCount === 0;
      }
      if (statusFilter === 'not_migrated') {
        return team.migratedSpaCount === 0 && team.migratedMsCount === 0;
      }
      return true;
    });

    const spaMigrated = spaData.filter(s => s.status === 'MIGRATED').length;
    const spaOutstanding = spaData.length - spaMigrated;

    const msMigrated = msData.filter(m => m.status === 'MIGRATED').length;
    const msOutstanding = msData.length - msMigrated;

    const teamsNotStarted = calculatedTeamStats.filter(
      team => team.migratedSpaCount === 0 && team.migratedMsCount === 0
    ).length;
    const teamsStarted = calculatedTeamStats.length - teamsNotStarted;

    return {
      allTeams: teams,
      filteredSpaData: filterByGlobal(fSpaData),
      filteredMsData: filterByGlobal(fMsData),
      teamStats: filteredTeamStats,
      summaryStats: {
        spa: { migrated: spaMigrated, outstanding: spaOutstanding },
        ms: { migrated: msMigrated, outstanding: msOutstanding },
        teams: { migrated: teamsStarted, outstanding: teamsNotStarted },
      },
    };
  }, [spaData, msData, teamFilter, globalFilter, statusFilter]);

  const summaryCards = [
    {
      title: "SPAs",
      migrated: summaryStats.spa.migrated,
      outstanding: summaryStats.spa.outstanding,
    },
    {
      title: "Microservices",
      migrated: summaryStats.ms.migrated,
      outstanding: summaryStats.ms.outstanding,
    },
    {
      title: "Team Progress",
      migrated: summaryStats.teams.migrated,
      outstanding: summaryStats.teams.outstanding,
      migratedLabel: "Teams Started",
    },
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
              migrated={card.migrated}
              outstanding={card.outstanding}
              migratedLabel={card.migratedLabel}
              index={index}
            />
          ))}
        </div>

        <MigrationBanner />

        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
          <div>
            <TeamCombobox teams={allTeams} value={teamFilter} onChange={setTeamFilter} />
          </div>

          <div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px] font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Show All</SelectItem>
                <SelectItem value="migrated">Migrated</SelectItem>
                <SelectItem value="not_migrated">Not Migrated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-grow">
            <div className="flex gap-2">
              <Input
                id="global-search"
                placeholder="Search..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="flex-grow"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setGlobalFilter("");
                  setTeamFilter("all");
                  setStatusFilter("all");
                }}
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

        <Tabs defaultValue="ms" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="spa">SPAs</TabsTrigger>
            <TabsTrigger value="ms">Microservices</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>
          <div className="relative min-h-[600px] overflow-hidden pt-4">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={activeTab}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                custom={direction}
                className="w-full"
              >
                <Suspense fallback={<TableSkeleton />}>
                  {activeTab === 'spa' && (
                    <DataTable columns={spaColumns} data={filteredSpaData} />
                  )}
                  {activeTab === 'ms' && (
                    <DataTable columns={msColumns} data={filteredMsData} />
                  )}
                  {activeTab === 'teams' && (
                    <DataTable columns={teamStatsColumns} data={teamStats} />
                  )}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </main>
    </>
  );
}