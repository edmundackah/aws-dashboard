"use client";

import { Button } from "./ui/button";
import { Download } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Spa, Microservice, TeamStat } from "@/app/data/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExportButtonProps {
  spaData: Spa[];
  msData: Microservice[];
  teamStats: TeamStat[];
  activeTab: string;
}

export function ExportButton({ spaData, msData, teamStats, activeTab }: ExportButtonProps) {

  const handleExport = () => {
    toast.info("Preparing your CSV file for download...");

    let dataToExport;
    let fileName = "dashboard-export.csv";

    switch (activeTab) {
      case "spa":
        dataToExport = spaData;
        fileName = "spa_export.csv";
        break;
      case "ms":
        dataToExport = msData;
        fileName = "microservices_export.csv";
        break;
      case "teams":
        dataToExport = teamStats;
        fileName = "teams_export.csv";
        break;
      default:
        toast.error("No data to export for this view.");
        return;
    }

    if (!dataToExport || dataToExport.length === 0) {
      toast.warning("There is no data to export.");
      return;
    }

    // Type-safe way to handle potentially different object shapes
    const flattenedData = dataToExport.map((item: Spa | Microservice | TeamStat) => {
      // Check if the 'environments' key exists before destructuring
      if ('environments' in item && item.environments && typeof item.environments === 'object') {
        const { environments, ...rest } = item;
        return { ...rest, ...environments };
      }
      // If no 'environments' key, return the item as-is
      return item;
    });

    const csv = Papa.unparse(flattenedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Data exported successfully!");
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exports the current <span className="capitalize font-semibold">{activeTab}</span> view to CSV.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}