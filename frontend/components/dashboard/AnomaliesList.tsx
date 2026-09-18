"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/context/dashboard-context";
import {
  FiArrowUpRight,
  FiMoreHorizontal,
  FiServer,
  FiLayers,
  FiDatabase,
} from "react-icons/fi";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Custom Tooltip matching exact design
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100 text-xs space-y-1.5 min-w-[160px]">
        <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">
          {label}
        </p>
        <div className="flex items-center justify-between gap-3 text-slate-700">
          <span className="flex items-center gap-1.5 font-semibold text-slate-600">
            <span className="w-2.5 h-0.5 bg-[#2265EF] rounded-full inline-block" />
            this period
          </span>
          <span className="font-extrabold text-slate-900">
            ${payload[0]?.value?.toLocaleString()}
          </span>
        </div>
        {payload[1] && (
          <div className="flex items-center justify-between gap-3 text-slate-500">
            <span className="flex items-center gap-1.5 font-semibold text-slate-500">
              <span className="w-2.5 h-0.5 border-b border-dashed border-slate-400 inline-block" />
              last period
            </span>
            <span className="font-extrabold text-slate-600">
              ${payload[1]?.value?.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function AnomaliesList() {
  const { data } = useDashboard();
  const [showMenu, setShowMenu] = useState(false);

  // Transform trend data for dual-line comparison chart
  const chartData = data.costTrend.slice(-12).map((item) => {
    const dayLabel = new Date(item.date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
    return {
      dateLabel: dayLabel,
      fullDate: item.date,
      thisPeriod: Math.round(item.cost),
      lastPeriod: Math.round(item.cost * 0.72 + (item.anomaly ? 300 : 50)),
      anomaly: item.anomaly,
    };
  });

  return (
    <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all hover:shadow-md w-full">
      <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
            Cost Anomalies & Impact
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              $446.7K
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
              <FiArrowUpRight className="w-3 h-3" />
              +24.4%
            </span>
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Options"
          >
            <FiMoreHorizontal className="w-4.5 h-4.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 text-xs animate-fadeIn space-y-1">
              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-3 py-1.5 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                View Anomaly Report
              </button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-2 space-y-4">
        {/* Scatter Line Chart (Current Period Line + Baseline + Scatter Anomaly Points) */}
        <div className="h-40 sm:h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="anomalyGradientSmall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2265EF" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2265EF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F1F5F9"
              />
              <XAxis
                dataKey="dateLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 500 }}
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 500 }}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Dotted Baseline Comparison Line */}
              <Line
                type="monotone"
                dataKey="lastPeriod"
                stroke="#CBD5E1"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />

              {/* Main Scatter Line with Gradient Fill */}
              <Area
                type="monotone"
                dataKey="thisPeriod"
                stroke="#2265EF"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#anomalyGradientSmall)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isAnomaly = payload.anomaly;
                  return (
                    <g key={`scatter-dot-sm-${payload.fullDate}`}>
                      {isAnomaly ? (
                        <>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={7}
                            fill="#EF4444"
                            fillOpacity={0.2}
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r={4.5}
                            fill="#EF4444"
                            stroke="#FFFFFF"
                            strokeWidth={1.8}
                            className="cursor-pointer shadow-xs"
                          />
                        </>
                      ) : (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={3}
                          fill="#2265EF"
                          stroke="#FFFFFF"
                          strokeWidth={1.2}
                          className="hover:r-4 transition-all cursor-pointer"
                        />
                      )}
                    </g>
                  );
                }}
                activeDot={{
                  r: 6,
                  fill: "#2265EF",
                  stroke: "#FFFFFF",
                  strokeWidth: 2.5,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 3 Accent Color Breakdown Lines (Production, EC2, DB Workloads) */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
          {/* Accent Card 1: Blue */}
          <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-1.5">
              <FiServer className="w-3 h-3 text-[#2265EF]" />
              <span className="text-xs font-extrabold text-slate-900">2,884</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-500 truncate">
              Production
            </div>
            <div className="h-1 w-full bg-[#2265EF] rounded-full mt-1" />
          </div>

          {/* Accent Card 2: Green */}
          <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-1.5">
              <FiLayers className="w-3 h-3 text-emerald-600" />
              <span className="text-xs font-extrabold text-slate-900">1,432</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-500 truncate">
              EC2 Scaling
            </div>
            <div className="h-1 w-full bg-emerald-500 rounded-full mt-1" />
          </div>

          {/* Accent Card 3: Orange */}
          <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-1.5">
              <FiDatabase className="w-3 h-3 text-amber-600" />
              <span className="text-xs font-extrabold text-slate-900">562</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-500 truncate">
              DB Workload
            </div>
            <div className="h-1 w-full bg-amber-500 rounded-full mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
