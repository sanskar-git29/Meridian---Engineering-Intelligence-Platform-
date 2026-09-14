"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/context/dashboard-context";
import { FiTrendingUp, FiAlertTriangle } from "react-icons/fi";

export function CostTrendChart() {
  const { getFilteredCostTrend, timeRange, setTimeRange, setSelectedDate } = useDashboard();
  const rawTrend = getFilteredCostTrend();

  // Format data for Recharts
  const chartData = rawTrend.map((item) => ({
    ...item,
    formattedDate: item.date.slice(5), // "07-03" -> "07-03"
  }));

  const anomalyPoints = chartData.filter((item) => item.anomaly);

  const formatYAxis = (value: number) => `$${(value / 1000).toFixed(1)}k`;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Daily Cost Trend & Anomaly Detection</CardTitle>
            <Badge variant="secondary">Recharts Powered</Badge>
          </div>
          <CardDescription className="mt-1">
            Real-time daily cloud spend visualization with automated AI anomaly alerts.
          </CardDescription>
        </div>

        {/* Timeframe Filter Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTimeRange("30d")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === "30d"
                ? "bg-white text-[#2265EF] shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange("60d")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === "60d"
                ? "bg-white text-[#2265EF] shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            60 Days
          </button>
          <button
            onClick={() => setTimeRange("august")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === "august"
                ? "bg-white text-[#2265EF] shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Aug Spike
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onClick={(e) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setSelectedDate(e.activePayload[0].payload.date);
                }
              }}
            >
              <defs>
                <linearGradient id="shadcnAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2265EF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2265EF" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />

              <XAxis
                dataKey="formattedDate"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                domain={[800, 3600]}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                        <p className="text-[10px] text-slate-400 font-semibold">{dataPoint.date}</p>
                        <p className="text-base font-extrabold text-white">
                          ${dataPoint.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                        {dataPoint.anomaly && (
                          <div className="pt-1 border-t border-slate-700">
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold">
                              ⚠️ {dataPoint.severity}: {dataPoint.label}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="cost"
                stroke="#2265EF"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#shadcnAreaGrad)"
              />

              {/* Anomaly Highlight Reference Markers */}
              {anomalyPoints.map((anomaly, i) => (
                <ReferenceDot
                  key={i}
                  x={anomaly.formattedDate}
                  y={anomaly.cost}
                  r={7}
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  isFront
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
