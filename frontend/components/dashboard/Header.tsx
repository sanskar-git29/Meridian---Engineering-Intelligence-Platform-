"use client";

import React, { useState } from "react";
import {
  FiSearch,
  FiCalendar,
  FiBell,
  FiSun,
  FiMoon,
  FiMenu,
  FiChevronDown,
} from "react-icons/fi";
import { useDashboard } from "@/context/dashboard-context";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const {
    data,
    timeRange,
    setTimeRange,
    searchQuery,
    setSearchQuery,
  } = useDashboard();
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  return (
    <div className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-20">
      {/* ROW 1: Top Navigation Bar (Search bar left, Theme icon, Notification bell, Single profile avatar right) */}
      <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 border-b border-slate-100">
        {/* Left: Mobile Menu & Search Input */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Open mobile menu"
          >
            <FiMenu className="w-5 h-5" />
          </button>

          {/* Search Input */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything..."
              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-full pl-10 pr-10 sm:pr-12 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2265EF] focus:bg-white transition-all"
            />
            <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Corner Icons: Theme Mode Icon, Notification, Single Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Light Theme Mode Icon */}
          <div
            className="p-2.5 rounded-full border border-slate-200/80 text-slate-600 bg-slate-50/60"
            title="Light Theme Active"
          >
            <FiSun className="w-4 h-4 text-amber-500" />
          </div>

          {/* Notification Bell Icon */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationPopup(!showNotificationPopup)}
              className="p-2.5 rounded-full border border-slate-200/80 text-slate-600 hover:bg-slate-50 transition-colors relative"
              aria-label="Notifications"
            >
              <FiBell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#2265EF] ring-2 ring-white animate-pulse" />
            </button>

            {/* Notifications Dropdown */}
            {showNotificationPopup && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-fadeIn space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900">
                    Anomalies & Alerts
                  </span>
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    3 Unresolved
                  </span>
                </div>
                <div className="space-y-2">
                  {data.anomalies.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-bold text-rose-600">
                          +{item.increasePercent}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200 mx-0.5" />

          {/* Single Profile Avatar Icon */}
          <div className="flex items-center gap-2 cursor-pointer" title={`${data.user.name} (${data.user.role})`}>
            <div className="w-8 h-8 rounded-full bg-[#2265EF] text-white flex items-center justify-center font-extrabold text-xs shadow-xs border border-white">
              AM
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: Dashboard Heading & Date Panel (No Add Widget, No Export Button) */}
      <div className="px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Dashboard Heading */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Cloud cost telemetry, anomaly detection, and CI/CD engineering health.
          </p>
        </div>

        {/* Right: Date Panel & Timeframe Pill Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 text-xs font-semibold text-slate-700 self-start sm:self-auto flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 text-slate-600">
            <FiCalendar className="w-4 h-4 text-[#2265EF]" />
            <span className="font-bold text-slate-800">Jul 3, 2026 - Aug 31, 2026</span>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <button
            onClick={() => setTimeRange("7d")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all ${
              timeRange === "7d"
                ? "bg-white text-[#2265EF] shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Last 7 days
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all ${
              timeRange === "30d"
                ? "bg-white text-[#2265EF] shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Last 30 days
          </button>
          <button
            onClick={() => setTimeRange("60d")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all ${
              timeRange === "60d"
                ? "bg-white text-[#2265EF] shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Last 60 days
          </button>
        </div>
      </div>
    </div>
  );
}
