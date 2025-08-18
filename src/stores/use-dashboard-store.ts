import { create } from "zustand";
import {
  MainDataApiResponse,
  processDashboardData,
  ServiceSummaryItem,
} from "@/lib/data";
import { Microservice, Spa, TeamStat } from "@/app/data/schema";

export type Page = "overview" | "spas" | "microservices" | "teams" | "burndown";

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
  currentPage: Page;
  rawMainData: MainDataApiResponse | null;
  burndownTargetOverrides: TargetOverrides;
  setBurndownTarget: (env: EnvKey, kind: 'spa' | 'ms', value?: string) => void;
  fetchData: () => Promise<void>;
  clearData: () => void;
  setCurrentPage: (page: Page) => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  loading: true, // Start in a loading state
  error: null,
  lastFetched: null,
  currentPage: "overview",
  rawMainData: null,
  burndownTargetOverrides: {
    dev: { spa: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_DEV, ms: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_DEV },
    sit: { spa: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_SIT, ms: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_SIT },
    uat: { spa: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_UAT, ms: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_UAT },
    nft: { spa: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_NFT, ms: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_NFT },
  },

  setBurndownTarget: (env, kind, value) => {
    set((state) => ({
      burndownTargetOverrides: {
        ...state.burndownTargetOverrides,
        [env]: { ...state.burndownTargetOverrides[env], [kind]: value },
      },
    }))
  },

  fetchData: async () => {
    const state = get();
    const now = Date.now();

    if (state.data && state.lastFetched && now - state.lastFetched < CACHE_DURATION) {
      set({ loading: false }); // If we have cached data, we're not loading.
      return;
    }

    set({ loading: true, error: null });

    try {
      // 1. Fetch initial data
      const mainDataUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!mainDataUrl) throw new Error("Main API URL not defined.");
      const mainDataRes = await fetch(mainDataUrl);
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
      const summaryUrl = process.env.NEXT_PUBLIC_SUMMARY_API_URL;
      if (!summaryUrl) return; // or throw, depending on desired behavior
      const summaryRes = await fetch(summaryUrl);
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

  setCurrentPage: (page: Page) => {
    set({ currentPage: page });
  },
}));
