import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-[#2265EF] text-white hover:bg-[#1B55CD]",
    secondary: "border-transparent bg-[#EDF3FF] text-[#2265EF]",
    destructive: "border-transparent bg-rose-100 text-rose-700 font-bold",
    outline: "text-slate-700 border-slate-200 bg-white",
    success: "border-transparent bg-[#8CE1BC]/30 text-[#0E5B3F] font-bold",
    warning: "border-transparent bg-amber-100 text-amber-800 font-bold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#2265EF]",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
