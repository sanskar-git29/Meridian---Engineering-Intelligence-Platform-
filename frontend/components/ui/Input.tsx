"use client";

import React, { forwardRef, useId, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      rightElement,
      className = "",
      containerClassName = "",
      id: customId,
      type = "text",
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      disabled,
      placeholder = " ",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;

    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(
      (value as string) || (defaultValue as string) || ""
    );

    const hasValue =
      value !== undefined
        ? String(value).length > 0
        : String(internalValue).length > 0;

    const isFloating = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    };

    return (
      <div className={`w-full ${containerClassName}`}>
        <div
          className={`group relative flex items-center rounded-xl border transition-all duration-200 bg-white ${
            error
              ? "border-red-400 bg-[#FDE4E9]/20 ring-4 ring-red-100"
              : isFocused
              ? "border-[#2265EF] ring-4 ring-[#E5EFFF]"
              : "border-slate-200 hover:border-slate-300"
          } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
        >
          {/* Left Icon: Styled in primary brand blue (#2265EF) matching the logo */}
          {icon && (
            <div className="pl-3.5 pr-1 text-[#2265EF] flex items-center justify-center shrink-0 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Main Input Wrapper */}
          <div className="relative flex-1 min-w-0">
            <input
              ref={ref}
              id={inputId}
              type={type}
              value={value}
              defaultValue={defaultValue}
              disabled={disabled}
              placeholder={placeholder}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleChange}
              aria-invalid={Boolean(error)}
              aria-describedby={
                error
                  ? `${inputId}-error`
                  : helperText
                  ? `${inputId}-helper`
                  : undefined
              }
              className={`peer w-full bg-transparent px-3.5 text-slate-900 text-sm font-medium focus:outline-none transition-all duration-200 ${
                isFloating ? "pt-5 pb-1.5" : "py-3.5"
              } ${disabled ? "cursor-not-allowed" : ""} ${className}`}
              {...props}
            />

            {/* Floating Label */}
            <label
              htmlFor={inputId}
              className={`absolute left-3.5 pointer-events-none transition-all duration-200 ease-out select-none origin-left ${
                isFloating
                  ? "top-1.5 text-[11px] font-semibold tracking-wide " +
                    (error
                      ? "text-red-600"
                      : isFocused
                      ? "text-[#2265EF]"
                      : "text-slate-500")
                  : "top-1/2 -translate-y-1/2 text-sm text-slate-500 font-normal"
              }`}
            >
              {label}
            </label>
          </div>

          {/* Right Element (e.g. Password Toggle) */}
          {rightElement && (
            <div className="pr-3 pl-1 flex items-center justify-center shrink-0">
              {rightElement}
            </div>
          )}
        </div>

        {/* Helper Text or Validation Error */}
        {error ? (
          <div
            id={`${inputId}-error`}
            className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 font-medium px-1 animate-fadeIn"
          >
            <FiAlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <div
            id={`${inputId}-helper`}
            className="mt-1.5 text-xs text-slate-500 px-1 font-normal"
          >
            {helperText}
          </div>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
