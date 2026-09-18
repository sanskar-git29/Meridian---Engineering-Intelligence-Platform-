"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { DashboardData, CostTrendItem } from "@/types/dashboard";
import { MOCK_DASHBOARD_DATA } from "@/lib/mock-dashboard-data";

export type TimeRangeOption = "7d" | "30d" | "60d" | "august";

interface DashboardContextType {
  data: DashboardData;
  selectedService: string | null;
  selectedTeam: string | null;
  selectedDate: string;
  timeRange: TimeRangeOption;
  searchQuery: string;
  isDarkMode: boolean;
  setSelectedService: (service: string | null) => void;
  setSelectedTeam: (team: string | null) => void;
  setSelectedDate: (date: string) => void;
  setTimeRange: (range: TimeRangeOption) => void;
  setSearchQuery: (query: string) => void;
  toggleDarkMode: () => void;
  getFilteredCostTrend: () => CostTrendItem[];
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data] = useState<DashboardData>(MOCK_DASHBOARD_DATA);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("2026-08-29");
  const [timeRange, setTimeRange] = useState<TimeRangeOption>("60d");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        if (next) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return next;
    });
  };

  const getFilteredCostTrend = (): CostTrendItem[] => {
    if (timeRange === "7d") {
      return data.costTrend.slice(-7);
    }
    if (timeRange === "30d") {
      return data.costTrend.slice(-30);
    }
    if (timeRange === "august") {
      return data.costTrend.filter((item) => item.date.startsWith("2026-08"));
    }
    return data.costTrend;
  };

  return (
    <DashboardContext.Provider
      value={{
        data,
        selectedService,
        selectedTeam,
        selectedDate,
        timeRange,
        searchQuery,
        isDarkMode,
        setSelectedService,
        setSelectedTeam,
        setSelectedDate,
        setTimeRange,
        setSearchQuery,
        toggleDarkMode,
        getFilteredCostTrend,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
