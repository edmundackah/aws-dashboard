import {create} from "zustand";
import {MainDataApiResponse, processDashboardData, ServiceSummaryItem,} from "@/lib/data";
import {Microservice, Spa, TeamStat} from "@/app/data/schema";

type EnvKey = "dev" | "sit" | "uat" | "nft"

type TargetOverrides = Record<EnvKey, { spa?: string; ms?: string }>

interface DashboardData {
  spaData: Spa[];
  msData: Microservice[];
  allTeamStats: TeamStat[];
  allTeams: string[];
  lastUpdate: string;
}

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  rawMainData: MainDataApiResponse | null;
  burndownTargetOverrides: TargetOverrides;
  // Multi-tenant departments
  departments: string[];
  selectedDepartment: string | null;
  initializeDepartment: (dept: string) => void;
  setDepartment: (dept: string) => Promise<void>;

  fetchData: () => Promise<void>;
  clearData: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function applyDepartmentToUrl(urlLike: string | undefined, department: string | null): string | undefined {
  if (!urlLike) return urlLike;
  if (!department) return urlLike;
  try {
    // Absolute URL case
    const u = new URL(urlLike, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const cleanPath = u.pathname.replace(/^\/+/, "");
    u.pathname = `/${department}/${cleanPath}`;
    return u.toString();
  } catch {
    // Relative URL case
    const clean = urlLike.replace(/^\/+/, "");
    return `/${department}/${clean}`;
  }
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  loading: true, // Start in a loading state
  error: null,
  lastFetched: null,
  rawMainData: null,
  burndownTargetOverrides: {
    dev: { spa: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_DEV, ms: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_DEV },
    sit: { spa: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_SIT, ms: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_SIT },
    uat: { spa: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_UAT, ms: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_UAT },
    nft: { spa: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_NFT, ms: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_NFT },
  },

  // Departments
  departments: (process.env.NEXT_PUBLIC_DEPARTMENTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  selectedDepartment: null,
  initializeDepartment: (dept) => {
    set({ selectedDepartment: dept });
    localStorage.setItem("selectedDepartment", dept);
  },
  setDepartment: async (dept) => {
    const state = get();
    if (state.selectedDepartment === dept) return;
    set({ selectedDepartment: dept, lastFetched: null, data: null, rawMainData: null, loading: true });
    localStorage.setItem("selectedDepartment", dept);
    await state.fetchData();
  },

  fetchData: async () => {
    const state = get();
    const now = Date.now();
    
    if (!state.selectedDepartment) {
      set({ loading: false });
      return; // Don't fetch if no department is selected
    }

    if (state.data && state.lastFetched && now - state.lastFetched < CACHE_DURATION) {
      set({ loading: false }); // If we have cached data, we're not loading.
      return;
    }

    set({ loading: true, error: null });

    try {
      // 1. Fetch initial data
      const baseMainUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseMainUrl) throw new Error("Main API URL not defined.");
      const mainDataUrl = applyDepartmentToUrl(baseMainUrl, state.selectedDepartment);
      const mainDataRes = await fetch(mainDataUrl!);
      const mainData: MainDataApiResponse = await mainDataRes.json();

      // Process and set initial data
      const initialProcessedData = processDashboardData(mainData);
      set({
        data: initialProcessedData,
        rawMainData: mainData,
        loading: false, // Set loading to false after initial data is processed
        lastFetched: now,
      });

      // 2. Fetch summary data in the background
      const baseSummaryUrl = process.env.NEXT_PUBLIC_SUMMARY_API_URL;
      if (!baseSummaryUrl) return; // or throw, depending on desired behavior
      const summaryUrl = applyDepartmentToUrl(baseSummaryUrl, state.selectedDepartment);
      const summaryRes = await fetch(summaryUrl!);
      const summaryData: ServiceSummaryItem[] = await summaryRes.json();

      // 3. Merge summary data and update state
      if (get().rawMainData) {
        const finalData = processDashboardData(get().rawMainData!, summaryData);
        set({ data: finalData });
      }
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "An error occurred",
      });
    }
  },

  clearData: () => {
    set({
      data: null,
      loading: false,
      error: null,
      lastFetched: null,
      rawMainData: null,
    });
  },
}));
