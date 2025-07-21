import { create } from "zustand";
import { Microservice, Spa, TeamStat } from "@/app/data/schema";

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
  fetchData: () => Promise<void>;
  clearData: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  loading: false,
  error: null,
  lastFetched: null,

  fetchData: async () => {
    const state = get();
    const now = Date.now();

    // Return cached data if it's still valid
    if (
      state.data &&
      state.lastFetched &&
      now - state.lastFetched < CACHE_DURATION
    ) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await fetch("/api/dashboard-data");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      set({
        data,
        loading: false,
        lastFetched: now,
        error: null,
      });
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
    });
  },
}));
