"use client";

import React, { forwardRef } from "react";
import { FiArrowRight, FiLoader } from "react-icons/fi";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  showArrow?: boolean;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      showArrow = true,
      iconRight,
      className = "",
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      "group relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#E5EFFF] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99]";

    // Variants
    const variantStyles = {
      primary:
        "bg-[#2265EF] text-white hover:bg-[#1B55CD] shadow-sm shadow-[#2265EF]/25 hover:shadow-md hover:shadow-[#2265EF]/35",
      secondary:
        "bg-[#EDF3FF] text-[#2265EF] hover:bg-[#E5EFFF] border border-[#E5EFFF]",
      outline:
        "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300",
      ghost: "text-slate-700 hover:bg-slate-100",
    };

    // Sizes
    const sizeStyles = {
      sm: "h-9 px-3.5 text-xs gap-1.5",
      md: "h-11 px-5 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
    };

    const renderRightIcon = () => {
      if (loading) {
        return <FiLoader className="w-4 h-4 animate-spin text-current shrink-0" />;
      }
      if (iconRight) {
        return <span className="shrink-0">{iconRight}</span>;
      }
      if (showArrow) {
        return (
          <FiArrowRight className="w-4 h-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1 text-current" />
        );
      }
      return null;
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        <span>{children}</span>
        {renderRightIcon()}
      </button>
    );
  }
);

Button.displayName = "Button";
