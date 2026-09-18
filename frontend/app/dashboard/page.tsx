"use client";

import React, { useState } from "react";
import { DashboardProvider } from "@/context/dashboard-context";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { CostTrendChart } from "@/components/dashboard/CostTrendChart";
import { AnomaliesList } from "@/components/dashboard/AnomaliesList";
import { ServiceBreakdown } from "@/components/dashboard/ServiceBreakdown";
import { GitHubActivity } from "@/components/dashboard/GitHubActivity";
import { MostDayActive } from "@/components/dashboard/MostDayActive";

function DashboardContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/60 flex font-sans text-slate-900 selection:bg-[#E5EFFF] selection:text-[#2265EF]">
      {/* Left Navigation Sidebar (Includes Mobile Drawer Toggle) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Bar Header */}
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* Main Workspace Content (100% Fluid & Fully Responsive Across Mobile, Tablet, Desktop) */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1650px] mx-auto w-full">
          {/* Top Stat KPI Cards */}
          <KpiCards />

          {/* Row 1: Full-Width Recharts Daily Cost Trend Graph */}
          <CostTrendChart />

          {/* Row 2: Main 2-Column Grid — Infrastructure (Left) vs Stacked Anomalies & Git Commits (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Column 1: Infrastructure & Allocation Breakdown */}
            <div className="h-full">
              <ServiceBreakdown />
            </div>

            {/* Column 2: Stacked Column — Cost Anomalies (Top) & Commits Day-by-Day (Bottom) */}
            <div className="flex flex-col gap-6 sm:gap-8 justify-between h-full">
              <AnomaliesList />
              <MostDayActive />
            </div>
          </div>

          {/* Row 3: Separate Full-Width Row for vixtora/backend Recent Activity Table */}
          <GitHubActivity />
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
