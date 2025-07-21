import { useDashboardStore } from "@/stores/use-dashboard-store";

// Function to download CSV
const downloadCSV = (csvContent: string, fileName: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to convert array of objects to CSV string
const convertToCSV = (data: Record<string, unknown>[]): string => {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(",") + "\n";
  const dataRows = data
    .map((row) =>
      headers.map((header) => JSON.stringify(row[header] ?? "")).join(","),
    )
    .join("\n");
  return headerRow + dataRows;
};

// Main export function
export const exportData = async (type: "spa" | "ms" | "teams" | "all") => {
  const { data } = useDashboardStore.getState();

  if (!data) {
    console.error("No data to export.");
    return;
  }

  const { spaData, msData, allTeamStats } = data;

  if (type === "all" || type === "spa") {
    downloadCSV(convertToCSV(spaData), "spa_data.csv");
  }
  if (type === "all" || type === "ms") {
    downloadCSV(convertToCSV(msData), "ms_data.csv");
  }
  if (type === "all" || type === "teams") {
    downloadCSV(convertToCSV(allTeamStats), "teams_data.csv");
  }
};
