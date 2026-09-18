"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/context/dashboard-context";
import {
  FiServer,
  FiUsers,
  FiFolder,
  FiGlobe,
  FiLayers,
  FiTrendingUp,
  FiTrendingDown,
  FiCheckCircle,
} from "react-icons/fi";
import { formatCurrency } from "@/lib/utils";

export function ServiceBreakdown() {
  const { data } = useDashboard();
  const [activeTab, setActiveTab] = useState<string>("services");

  return (
    <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all hover:shadow-md w-full overflow-hidden h-full flex flex-col justify-between">
      <div>
        <CardHeader className="p-0 pb-4 border-b border-slate-100">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Infrastructure & Allocation Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 font-medium">
              Multi-dimensional cost allocation across services, engineering teams, projects, environments, and AWS regions.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-5 flex-1 flex flex-col justify-between">
          <Tabs defaultValue="services" value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
          {/* Scrollable & Responsive Tab Navigation Bar */}
          <div className="w-full overflow-x-auto pb-1 mb-5 no-scrollbar">
            <TabsList className="inline-flex min-w-full sm:min-w-0 items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl text-xs font-semibold">
              <TabsTrigger
                value="services"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all data-[state=active]:bg-white data-[state=active]:text-[#2265EF] data-[state=active]:shadow-2xs text-slate-600 font-bold"
              >
                <FiServer className="w-3.5 h-3.5" />
                <span>Services</span>
              </TabsTrigger>
              <TabsTrigger
                value="teams"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all data-[state=active]:bg-white data-[state=active]:text-[#2265EF] data-[state=active]:shadow-2xs text-slate-600 font-bold"
              >
                <FiUsers className="w-3.5 h-3.5" />
                <span>Teams</span>
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all data-[state=active]:bg-white data-[state=active]:text-[#2265EF] data-[state=active]:shadow-2xs text-slate-600 font-bold"
              >
                <FiFolder className="w-3.5 h-3.5" />
                <span>Projects</span>
              </TabsTrigger>
              <TabsTrigger
                value="environments"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all data-[state=active]:bg-white data-[state=active]:text-[#2265EF] data-[state=active]:shadow-2xs text-slate-600 font-bold"
              >
                <FiLayers className="w-3.5 h-3.5" />
                <span>Environments</span>
              </TabsTrigger>
              <TabsTrigger
                value="regions"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all data-[state=active]:bg-white data-[state=active]:text-[#2265EF] data-[state=active]:shadow-2xs text-slate-600 font-bold"
              >
                <FiGlobe className="w-3.5 h-3.5" />
                <span>Regions</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* AWS Services Tab */}
          <TabsContent value="services" className="m-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.services.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-slate-300 transition-all duration-200 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                        {item.name}
                      </span>
                      <Badge variant="success" className="text-[10px] py-0.5 px-2 shrink-0">
                        <FiCheckCircle className="w-2.5 h-2.5 mr-1 inline-block" /> {item.status}
                      </Badge>
                    </div>
                    <span
                      className={`text-xs font-bold flex items-center gap-0.5 shrink-0 ${
                        item.trend > 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {item.trend > 0 ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
                      {item.trend > 0 ? `+${item.trend}%` : `${item.trend}%`}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                      {formatCurrency(item.cost)}
                    </span>
                    <span className="text-xs font-bold text-slate-500 shrink-0">
                      {item.percentage}% share
                    </span>
                  </div>

                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2265EF] h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="m-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.teams.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-slate-300 transition-all duration-200 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                      {item.name} Team
                    </span>
                    <span
                      className={`text-xs font-bold flex items-center gap-0.5 shrink-0 ${
                        item.trend > 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {item.trend > 0 ? `+${item.trend}%` : `${item.trend}%`}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                      {formatCurrency(item.cost)}
                    </span>
                    <span className="text-xs font-bold text-slate-500 shrink-0">
                      {item.percentage}% share
                    </span>
                  </div>

                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#345EE5] h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="m-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.projects.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-slate-300 transition-all duration-200 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                      {item.name}
                    </span>
                    <span
                      className={`text-xs font-bold flex items-center gap-0.5 shrink-0 ${
                        item.trend > 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {item.trend > 0 ? `+${item.trend}%` : `${item.trend}%`}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                      {formatCurrency(item.cost)}
                    </span>
                    <span className="text-xs font-bold text-slate-500 shrink-0">
                      {item.percentage}% share
                    </span>
                  </div>

                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2265EF] h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Environments Tab */}
          <TabsContent value="environments" className="m-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.filters.environments.map((env, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-slate-300 transition-all duration-200 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900 text-sm uppercase">
                      {env}
                    </span>
                    <Badge variant={env === "production" ? "destructive" : "secondary"} className="shrink-0">
                      {env === "production" ? "Primary" : "Isolated"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {env === "production" ? "High-availability multi-region cluster" : "Staging preview sandbox environment"}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Regions Tab */}
          <TabsContent value="regions" className="m-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.filters.regions.map((reg, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-slate-300 transition-all duration-200 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{reg}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">AWS Region</Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {reg === "eu-west-1" ? "Ireland Datacenter (Origin of Traffic Spike)" : "US East / West Datacenters"}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      </div>
    </Card>
  );
}
