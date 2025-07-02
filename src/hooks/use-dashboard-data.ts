"use client";

import {useEffect, useState} from 'react';
import axios from 'axios';
import {Microservice, Spa} from '@/app/data/schema';

interface DashboardData {
  spaData: Spa[];
  msData: Microservice[];
  lastUpdate: string;
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
        await new Promise(resolve => setTimeout(resolve, 750));
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}`);
        setData(response.data);
      } catch (err) {
        const errorMessage = "There was a problem fetching the dashboard data.";
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