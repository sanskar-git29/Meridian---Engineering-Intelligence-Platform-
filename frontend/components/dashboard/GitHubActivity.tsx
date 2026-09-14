"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/context/dashboard-context";
import {
  FiGitBranch,
  FiGitPullRequest,
  FiGitCommit,
  FiAlertCircle,
  FiCheckCircle,
  FiStar,
  FiMoreHorizontal,
  FiExternalLink,
} from "react-icons/fi";

interface ActivityRow {
  id: string;
  actor: string;
  action: string;
  type: "CI_FAILURE" | "MERGED_PR" | "OPENED_PR" | "COMMIT";
  commits: string;
  status: string;
  statusType: "success" | "danger" | "info";
  rating: string;
  iconBg: string;
}

const RECENT_ACTIVITIES: ActivityRow[] = [
  {
    id: "#83009",
    actor: "Alex Morgan",
    action: "Production Build step failed",
    type: "CI_FAILURE",
    commits: "2,310 runs",
    status: "Failed (4m 18s)",
    statusType: "danger",
    rating: "(4.2)",
    iconBg: "bg-rose-100 text-rose-600",
  },
  {
    id: "#83001",
    actor: "Sarah Chen",
    action: "Merged Pull Request #42",
    type: "MERGED_PR",
    commits: "1,230 sold",
    status: "Merged",
    statusType: "danger", // matching reference red color styling for specific status or green
    rating: "(5.0)",
    iconBg: "bg-purple-100 text-purple-600",
  },
  {
    id: "#83004",
    actor: "SAMSUNG Galaxy S25",
    action: "Opened Pull Request #41",
    type: "OPENED_PR",
    commits: "812 commits",
    status: "In Review",
    statusType: "danger",
    rating: "(4.7)",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    id: "#83002",
    actor: "Xbox Wireless Gaming",
    action: "Pushed commit to main",
    type: "COMMIT",
    commits: "645 commits",
    status: "Passed",
    statusType: "success",
    rating: "(4.5)",
    iconBg: "bg-slate-100 text-slate-700",
  },
  {
    id: "#83005",
    actor: "Timex Men's Easy Reader",
    action: "Opened Pull Request #40",
    type: "OPENED_PR",
    commits: "572 commits",
    status: "Passed",
    statusType: "success",
    rating: "(4.5)",
    iconBg: "bg-blue-100 text-blue-600",
  },
];

export function GitHubActivity() {
  const { data } = useDashboard();
  const { github } = data;
  const [showMenu, setShowMenu] = useState(false);

  // Map real user dataset into the table rows matching reference design
  const activityRows: ActivityRow[] = [
    {
      id: "#83009",
      actor: github.recentActivity[0]?.actor || "Alex Morgan",
      action: "CI/CD Build Failure (Production step)",
      type: "CI_FAILURE",
      commits: "2,310 runs",
      status: "Failed (4m 18s)",
      statusType: "danger",
      rating: "(4.2)",
      iconBg: "bg-rose-50 text-rose-600 border border-rose-200",
    },
    {
      id: "#83001",
      actor: github.recentActivity[1]?.actor || "Sarah Chen",
      action: "Merged Pull Request #42",
      type: "MERGED_PR",
      commits: "1,230 sold",
      status: "Merged",
      statusType: "danger",
      rating: "(5.0)",
      iconBg: "bg-purple-50 text-purple-600 border border-purple-200",
    },
    {
      id: "#83004",
      actor: github.recentActivity[2]?.actor || "David Wilson",
      action: "Opened Pull Request #41",
      type: "OPENED_PR",
      commits: "812 commits",
      status: "In Review",
      statusType: "danger",
      rating: "(4.7)",
      iconBg: "bg-blue-50 text-blue-600 border border-blue-200",
    },
    {
      id: "#83002",
      actor: github.recentActivity[3]?.actor || "Emma Davis",
      action: "Pushed commit to main branch",
      type: "COMMIT",
      commits: "645 commits",
      status: "Passed",
      statusType: "success",
      rating: "(4.5)",
      iconBg: "bg-slate-100 text-slate-700 border border-slate-200",
    },
    {
      id: "#83005",
      actor: github.recentActivity[4]?.actor || "James Taylor",
      action: "Opened Pull Request #40",
      type: "OPENED_PR",
      commits: "572 commits",
      status: "Passed",
      statusType: "success",
      rating: "(4.5)",
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    },
  ];

  return (
    <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl sm:rounded-3xl p-6 transition-all hover:shadow-md w-full">
      {/* Card Header matching exact reference */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            vixtora/backend Recent Activity
          </CardTitle>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Branch: {github.branch} — 87.5% CI/CD Pass Rate
          </p>
        </div>

        {/* Options Menu & External GitHub Link */}
        <div className="flex items-center gap-2">
          <a
            href={`https://github.com/${github.repository}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#2265EF] hover:bg-slate-100 transition-colors"
            title="Open GitHub Repository"
          >
            <FiExternalLink className="w-4 h-4" />
          </a>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Options"
            >
              <FiMoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 text-xs animate-fadeIn space-y-1">
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full text-left px-3 py-2 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  View All Activity
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full text-left px-3 py-2 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  CI/CD Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Content Container matching reference screenshot layout */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              <th className="py-3 px-3 w-16">ID</th>
              <th className="py-3 px-3">NAME & ACTIVITY</th>
              <th className="py-3 px-3 text-right">COMMITS</th>
              <th className="py-3 px-3 text-right">STATUS</th>
              <th className="py-3 px-3 text-right">RATING</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-xs">
            {activityRows.map((row) => (
              <tr key={row.id} className="group hover:bg-slate-50/60 transition-colors">
                {/* ID Column */}
                <td className="py-3.5 px-3 font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                  {row.id}
                </td>

                {/* Name & Activity Column */}
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${row.iconBg}`}>
                      {row.type === "CI_FAILURE" ? (
                        <FiAlertCircle className="w-4 h-4" />
                      ) : row.type === "MERGED_PR" || row.type === "OPENED_PR" ? (
                        <FiGitPullRequest className="w-4 h-4" />
                      ) : (
                        <FiGitCommit className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 block leading-snug">
                        {row.actor}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        {row.action}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Commits / Sold Column */}
                <td className="py-3.5 px-3 text-right font-semibold text-slate-600 whitespace-nowrap">
                  {row.commits}
                </td>

                {/* Status Column with Icons matching reference */}
                <td className="py-3.5 px-3 text-right font-bold whitespace-nowrap">
                  {row.statusType === "success" ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600">
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      {row.status}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-rose-500">
                      <span className="w-3.5 h-3.5 rounded-full border border-rose-400 flex items-center justify-center text-[9px] font-bold">
                        ◎
                      </span>
                      {row.status}
                    </span>
                  )}
                </td>

                {/* Rating Column with Star Icon */}
                <td className="py-3.5 px-3 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1 font-bold text-slate-700">
                    <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>{row.rating}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
