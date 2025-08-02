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
const convertToCSV = (data: Record<string, unknown>[], dataType?: "spa" | "ms" | "teams"): string => {
  if (data.length === 0) return "";
  
  // Define consistent headers for each data type
  const getHeaders = (type?: string): string[] => {
    switch (type) {
      case "spa":
        return ["projectName", "homepage", "subgroupName", "projectLink", "status", "dev", "sit", "uat", "nft", "technicalSme", "lastUpdate"];
      case "ms":
        return ["projectName", "subgroupName", "projectLink", "status", "dev", "sit", "uat", "nft", "otel", "mssdk", "technicalSme", "lastUpdate"];
      case "teams":
        return ["teamName", "migratedSpaCount", "outstandingSpaCount", "migratedMsCount", "outstandingMsCount", "technicalSme"];
      default:
        // Fallback: get all unique keys from all objects
        const allKeys = new Set<string>();
        data.forEach(obj => Object.keys(obj).forEach(key => allKeys.add(key)));
        return Array.from(allKeys).sort();
    }
  };
  
  // Transform data to handle nested environments object if it exists
  const transformData = (data: Record<string, unknown>[], type?: string): Record<string, unknown>[] => {
    if (type !== "spa" && type !== "ms") return data;
    
    return data.map(row => {
      const transformed = { ...row };
      
      // If environments is a nested object, extract individual environment fields
      if (transformed.environments && typeof transformed.environments === 'object') {
        const envObj = transformed.environments as Record<string, unknown>;
        transformed.dev = envObj.dev;
        transformed.sit = envObj.sit;
        transformed.uat = envObj.uat;
        transformed.nft = envObj.nft;
        delete transformed.environments;
      }
      
      return transformed;
    });
  };
  
  const transformedData = transformData(data, dataType);
  const headers = getHeaders(dataType);
  const headerRow = headers.join(",") + "\n";
  
  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    
    // Handle boolean values for environment fields
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    
    // Handle objects - convert to readable format
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        return value.join("; ");
      }
      
      // Handle specific object types
      const obj = value as Record<string, unknown>;
      
      // Handle technicalSme object
      if ("name" in obj && "email" in obj) {
        return `${obj.name} (${obj.email})`;
      }
      
      // Handle otel object
      if ("traces" in obj || "metrics" in obj || "logs" in obj) {
        const features = Object.entries(obj)
          .filter(([, val]) => val === true)
          .map(([key]) => key);
        return features.length > 0 ? features.join(", ") : "None";
      }
      
      // Handle mssdk object (framework flags)
      if ("nodejs-express" in obj || "java-spring-boot" in obj || "python-fastapi" in obj) {
        const frameworks = Object.entries(obj)
          .filter(([, val]) => val === true)
          .map(([key]) => key);
        return frameworks.length > 0 ? frameworks.join(", ") : "None";
      }
      
      // Generic object handling - convert to key:value pairs
      const entries = Object.entries(obj)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; ");
      return entries || "Empty Object";
    }
    
    // Convert to string and handle special cases
    let strValue = String(value);
    
    // If the value contains comma, newline, or quotes, wrap in quotes and escape quotes
    if (strValue.includes(",") || strValue.includes("\n") || strValue.includes('"')) {
      strValue = '"' + strValue.replace(/"/g, '""') + '"';
    }
    
    return strValue;
  };
  
  const dataRows = transformedData
    .map((row) =>
      headers.map((header) => formatCellValue(row[header])).join(","),
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
    downloadCSV(convertToCSV(spaData, "spa"), "spa_data.csv");
  }
  if (type === "all" || type === "ms") {
    downloadCSV(convertToCSV(msData, "ms"), "ms_data.csv");
  }
  if (type === "all" || type === "teams") {
    downloadCSV(convertToCSV(allTeamStats, "teams"), "teams_data.csv");
  }
};
