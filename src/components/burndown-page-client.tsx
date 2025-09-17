"use client";

import * as React from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {HelpCircle} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorDisplay} from "@/components/error-display";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusExplainer} from "@/components/burndown/StatusExplainer";
import {normalizeBurndownData} from "@/components/burndown/data";
import {calculateEnvironmentMetrics} from "@/components/burndown/logic";
import type {BurndownResponse, EnvBurndownPoint} from "@/components/burndown/types";
import {BurndownEnvChartCard} from "@/components/burndown/BurndownEnvChartCard";
import { motion, type Variants } from "framer-motion";
import {useDashboardStore} from "@/stores/use-dashboard-store";
import {applyDepartmentToUrl} from "@/lib/department-utils";

export function BurndownPageClient() {
  const [burndown, setBurndown] = React.useState< { [key: string]: EnvBurndownPoint[] } | null >(null);
  const [targets, setTargets] = React.useState< { [key: string]: { spa: string; ms: string } } | null >(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const mountRef = React.useRef(0);
  const { selectedDepartment } = useDashboardStore();
  
  // Increment mount counter on every render to force animation
  mountRef.current += 1;
  const animationKey = mountRef.current;

  React.useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchBurndown = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = process.env.NEXT_PUBLIC_BURNDOWN_API_URL;
        if (!baseUrl || baseUrl.trim().length === 0) {
          throw new Error("Burndown API URL is not configured (NEXT_PUBLIC_BURNDOWN_API_URL).");
        }
        const url = applyDepartmentToUrl(baseUrl, selectedDepartment);
        const res = await fetch(url!, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to fetch burndown: ${res.status}`);
        const json: BurndownResponse = await res.json();
        if (!isMounted) return;
        const { data, targets } = normalizeBurndownData(json);
        setBurndown(data);
        setTargets(targets); // Store targets here
      } catch (e) {
        if (!isMounted) return;
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load burndown data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBurndown();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedDepartment]);

  const environmentMetrics = React.useMemo(() => {
    if (!burndown || !targets) return [];
    return calculateEnvironmentMetrics(burndown, targets);
  }, [burndown, targets]);


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!burndown || Object.keys(burndown).length === 0) {
    return <ErrorDisplay message="No burndown data available" />;
  }

  // Targets are optional (read from .env); proceed even if none found
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };


  return (
      <div className="space-y-1">
        <div className="md:hidden">
          <StatusExplainer />
        </div>


        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-2 items-stretch content-stretch min-h-[calc(100vh-7rem)] grid-rows-[repeat(2,minmax(0,1fr))]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {environmentMetrics.map((metrics) => {
            const chartData = burndown?.[metrics.env] || [];
            
            const filteredChartData = chartData.filter(point =>
              point.spaActual != null ||
              point.msActual != null ||
              point.spaPlanned != null ||
              point.msPlanned != null
            );

            // Use data as-is; no synthetic alignment to a global start date
            const alignedChartData = filteredChartData;

            if (alignedChartData.length === 0) {
              return (
                <Card key={metrics.env}>
                  <CardHeader>
                    <CardTitle className="capitalize">{metrics.env.toUpperCase()} Burndown</CardTitle>
                    <CardDescription>No chart data available for this environment.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
              );
            }
            
            return (
              <motion.div key={metrics.env} variants={itemVariants}>
                <BurndownEnvChartCard 
                  metrics={metrics} 
                  data={alignedChartData} 
                  animationKey={animationKey}
                />
              </motion.div>
            );
          })}
        </motion.div>
        <BurndownHelpFab />
      </div>
  );
}

function BurndownHelpFab() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon" aria-label="Open status guide" className="h-10 w-10 rounded-full shadow-lg">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Status guide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-block size-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <div><span className="font-medium text-primary">Completed</span> — zero remaining achieved by the target date</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block size-2.5 rounded-full bg-green-500 flex-shrink-0" />
                <div><span className="font-medium text-primary">On track</span> — projected completion (based on burn rate) is before the target date</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block size-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                <div><span className="font-medium text-primary">At risk</span> — projected completion exceeds target date or low confidence in projections</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block size-2.5 rounded-full bg-red-500 flex-shrink-0" />
                <div>
                  <div><span className="font-medium text-primary">Completed (Late)</span> — zero remaining achieved after the target date</div>
                  <div><span className="font-medium text-primary">Target missed</span> — target date passed with items still remaining</div>
                </div>
              </div>
              <div className="pt-2 text-sm text-primary/80 leading-6">
                <div className="mb-1">Status is calculated using linear regression on historical data to project completion dates with confidence scores.</div>
                <div>Dotted lines show planned remaining; solid lines show actual remaining. Two targets per environment: SPA and Microservices.</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

