"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiTrendingUp,
  FiServer,
  FiAlertTriangle,
  FiGitBranch,
  FiSliders,
  FiSettings,
  FiHelpCircle,
  FiShield,
  FiLayers,
  FiZap,
  FiX,
} from "react-icons/fi";
import { useDashboard } from "@/context/dashboard-context";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data } = useDashboard();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: FiGrid },
    { name: "Cost Analytics", href: "#analytics", icon: FiTrendingUp },
    { name: "Services", href: "#services", icon: FiServer, badge: data.summary.activeServices },
    { name: "Anomalies", href: "#anomalies", icon: FiAlertTriangle, badge: data.anomalies.length, badgeColor: "bg-amber-100 text-amber-700" },
    { name: "Attribution", href: "#attribution", icon: FiLayers },
    { name: "GitHub & CI", href: "#github", icon: FiGitBranch },
    { name: "Integrations", href: "#integrations", icon: FiSliders },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden animate-fadeIn"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-4 selection:bg-[#E5EFFF] selection:text-[#2265EF] z-50 shrink-0 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Branding Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2265EF] text-white flex items-center justify-center font-bold text-base shadow-sm shadow-[#2265EF]/30">
                <FiShield className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-slate-900 text-base tracking-tight truncate leading-tight">
                  {data.organization.name}
                </h1>
                <p className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase truncate">
                  Cloud Intelligence
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Group */}
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Platform Menu
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href || item.href === "/dashboard";
              const Icon = item.icon;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-[#EDF3FF] text-[#2265EF] border border-[#E5EFFF]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-[#2265EF]" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.badgeColor || "bg-[#E5EFFF] text-[#2265EF]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section & Pro Banner */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2265EF] to-[#1B55CD] text-white shadow-lg shadow-[#2265EF]/20 space-y-3 relative overflow-hidden">
            <div className="absolute -right-3 -bottom-3 w-20 h-20 bg-white/10 rounded-full blur-md" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                <FiZap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-white tracking-tight">AI Optimization</span>
            </div>
            <p className="text-[11px] text-white/90 leading-snug">
              Save up to 18% on AWS EC2 & RDS instance rightsizing.
            </p>
            <button className="w-full py-2 bg-white text-[#2265EF] rounded-xl text-xs font-bold transition-all hover:bg-slate-50 shadow-xs">
              View Suggestions
            </button>
          </div>

          {/* Footer Links */}
          <div className="space-y-1 px-1">
            <a
              href="#settings"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <FiSettings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </a>
            <a
              href="#support"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <FiHelpCircle className="w-4 h-4 text-slate-400" />
              <span>Help & Support</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
