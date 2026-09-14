"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/context/dashboard-context";
import { formatCurrency } from "@/lib/utils";
import {
  FiDollarSign,
  FiServer,
  FiAlertTriangle,
  FiActivity,
  FiArrowUpRight,
  FiCheckCircle,
} from "react-icons/fi";

export function KpiCards() {
  const { data } = useDashboard();
  const { summary, github } = data;

  const cards = [
    {
      title: "Total Cloud Spend",
      value: formatCurrency(summary.totalCost),
      badgeText: `+${summary.costChangePercent}%`,
      badgeVariant: "destructive" as const,
      subtitle: `vs ${formatCurrency(summary.previousPeriodCost)} last period`,
      icon: FiDollarSign,
      iconBg: "bg-[#E5EFFF] text-[#2265EF]",
    },
    {
      title: "Average Daily Cost",
      value: formatCurrency(summary.averageDailyCost),
      badgeText: `${summary.activeServices} Services`,
      badgeVariant: "secondary" as const,
      subtitle: "EC2, RDS, EKS, CloudFront, S3",
      icon: FiServer,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      title: "Highest Daily Cost",
      value: formatCurrency(summary.highestDailyCost),
      badgeText: "Aug Spike",
      badgeVariant: "warning" as const,
      subtitle: `Peak date: ${summary.highestCostDate}`,
      icon: FiAlertTriangle,
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      title: "CI/CD Pass Rate",
      value: `${github.ciCd.successRate}%`,
      badgeText: `${github.ciCd.successful}/${github.ciCd.totalRuns} Runs`,
      badgeVariant: "success" as const,
      subtitle: `Latest failure: ${github.latestFailure.workflow}`,
      icon: FiActivity,
      iconBg: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;

        return (
          <Card key={idx} className="group hover:border-slate-300">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {card.title}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-transform duration-200 group-hover:scale-105 ${card.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {card.value}
                  </span>
                  <Badge variant={card.badgeVariant}>{card.badgeText}</Badge>
                </div>
                <p className="text-xs text-slate-400 font-medium truncate pt-1">
                  {card.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
