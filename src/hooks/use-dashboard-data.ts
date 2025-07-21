"use client";

import {useEffect, useState} from 'react';
import axios from 'axios';
import {Microservice, Spa} from '@/app/data/schema';

interface DashboardData {
  spaData: Spa[];
  msData: Microservice[];
  lastUpdate: string;
}

interface ServiceSummaryItem {
  projectId: number;
  projectName: string;
  subgroupName: string;
  subgroupId: number;
  type: 'SPA' | 'MICROSERVICE';
  status: 'MIGRATED' | 'NOT_MIGRATED';
  projectLink: string;
  homepage?: string;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise(resolve => setTimeout(resolve, 250));

        console.log("Fetching data");

        const [mainResponse, summaryResponse] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}`),
          axios.get<ServiceSummaryItem[]>(`${process.env.NEXT_PUBLIC_SUMMARY_API_URL}`)
        ]);

        console.log("This log better appear in Grafana");

        const mainData = mainResponse.data;
        const summaryData = summaryResponse.data;

        const migratedSpas: Spa[] = mainData.spaData.map((spa: Spa) => ({ ...spa, status: 'MIGRATED' }));
        const migratedMs: Microservice[] = mainData.msData.map((ms: Microservice) => ({ ...ms, status: 'MIGRATED' }));

        const notMigratedSpas: Spa[] = summaryData
          .filter((item) => item.type === 'SPA' && item.status === 'NOT_MIGRATED')
          .map((item) => ({
            projectName: item.projectName,
            homepage: item.homepage || '#',
            subgroupName: item.subgroupName,
            projectLink: item.projectLink,
            status: 'NOT_MIGRATED',
            environments: { dev: false, sit: false, uat: false, nft: false },
          }));

        const notMigratedMs: Microservice[] = summaryData
          .filter((item) => item.type === 'MICROSERVICE' && item.status === 'NOT_MIGRATED')
          .map((item) => ({
            projectName: item.projectName,
            subgroupName: item.subgroupName,
            projectLink: item.projectLink,
            status: 'NOT_MIGRATED',
            otel: 'N/A',
            mssdk: 'N/A',
            environments: { dev: false, sit: false, uat: false, nft: false },
          }));

        setData({
          spaData: [...migratedSpas, ...notMigratedSpas],
          msData: [...migratedMs, ...notMigratedMs],
          lastUpdate: mainData.lastUpdate,
        });

      } catch (err) {
        const errorMessage = "There was a problem fetching the (dashboard) data.";
        console.error(errorMessage, err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, isLoading, error };
}