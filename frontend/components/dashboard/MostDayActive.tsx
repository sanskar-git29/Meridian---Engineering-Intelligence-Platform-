"use client";

import React, { useState } from "react";
import { FiMoreHorizontal } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CommitDayActivity {
  day: string;
  fullDay: string;
  commits: number;
  heightPercent: number; // 0 to 100
}

const WEEKLY_COMMIT_DATA: CommitDayActivity[] = [
  { day: "Sun", fullDay: "Sunday", commits: 4210, heightPercent: 55 },
  { day: "Mon", fullDay: "Monday", commits: 3850, heightPercent: 48 },
  { day: "Tue", fullDay: "Tuesday", commits: 8162, heightPercent: 90 }, // Peak commit day from screenshot
  { day: "Wed", fullDay: "Wednesday", commits: 3420, heightPercent: 42 },
  { day: "Thu", fullDay: "Thursday", commits: 2610, heightPercent: 32 },
  { day: "Fri", fullDay: "Friday", commits: 4890, heightPercent: 62 },
  { day: "Sat", fullDay: "Saturday", commits: 5340, heightPercent: 68 },
];

export function MostDayActive() {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(2); // Tuesday default peak
  const [showMenu, setShowMenu] = useState(false);

  const activeDay = WEEKLY_COMMIT_DATA[selectedDayIndex];

  return (
    <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 hover:shadow-md h-full flex flex-col justify-between">
      <div>
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
              Most Day Active
            </CardTitle>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Number of commits per day
            </p>
          </div>

          {/* Options Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Options"
            >
              <FiMoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 text-xs animate-fadeIn space-y-1">
                <button
                  onClick={() => {
                    setSelectedDayIndex(2); // Reset to Tue
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Reset Peak Day (Tue)
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full text-left px-3 py-1.5 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  View Commit Logs
                </button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-2">
          {/* Compact Bar Chart Container */}
          <div className="pt-3 pb-1 flex items-end justify-between gap-1.5 sm:gap-2.5 h-36 sm:h-40 px-1">
            {WEEKLY_COMMIT_DATA.map((item, idx) => {
              const isSelected = idx === selectedDayIndex;

              return (
                <div
                  key={item.day}
                  onClick={() => setSelectedDayIndex(idx)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  title={`${item.commits.toLocaleString()} commits on ${item.fullDay}`}
                >
                  {/* Floating Value Pill */}
                  <div className="h-5 mb-1 flex items-center justify-center">
                    {isSelected ? (
                      <span className="text-[11px] font-extrabold text-slate-900 animate-fadeIn tracking-tight">
                        {item.commits.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.commits.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Compact Pill Shaped Vertical Bar */}
                  <div className="w-full max-w-[32px] bg-slate-100/80 rounded-xl flex items-end justify-center p-0.5 h-24 sm:h-28 relative">
                    <div
                      style={{ height: `${item.heightPercent}%` }}
                      className={`w-full rounded-xl transition-all duration-300 ${
                        isSelected
                          ? "bg-[#2265EF] shadow-xs shadow-blue-500/20"
                          : "bg-slate-200/90 group-hover:bg-slate-300/80"
                      }`}
                    />
                  </div>

                  {/* Day Label on X-Axis */}
                  <span
                    className={`text-[11px] mt-2 font-bold transition-colors ${
                      isSelected ? "text-[#2265EF]" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </div>

      {/* Selected Commit Summary Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="font-medium">Active Day:</span>
        <span className="font-bold text-slate-900">
          {activeDay.fullDay} — <span className="text-[#2265EF]">{activeDay.commits.toLocaleString()} commits</span>
        </span>
      </div>
    </Card>
  );
}
