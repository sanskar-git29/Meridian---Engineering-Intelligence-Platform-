"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiMail,
  FiLock,
  FiBriefcase,
  FiEye,
  FiEyeOff,
  FiShield,
  FiCheckCircle,
} from "react-icons/fi";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginSchema, LoginFormData } from "@/features/auth/schemas/login-schema";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      organizationName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    
    // Log form validation payload
    console.log("Form validated successfully:", data);
    
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setIsSubmittedSuccess(true);
    
    setTimeout(() => {
      setIsSubmittedSuccess(false);
    }, 4000);
  };

  return (
    <div className="w-full space-y-7">
      {/* Brand Identity & Header Anchor */}
      <div className="space-y-5">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#2265EF] text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-[#2265EF]/20">
            <FiShield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-xl tracking-tight block leading-none">
              MERIDIAN
            </span>
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
              Engineering Intelligence
            </span>
          </div>
        </div>

        {/* Heading & Clear Subtitle Hierarchy */}
        <div className="space-y-1.5 pt-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Sign in to your account
          </h1>
          <p className="text-base text-slate-600 font-medium leading-relaxed">
            Welcome back! Enter your organization details below to access your workspace.
          </p>
        </div>
      </div>

      {/* Success Feedback Banner */}
      {isSubmittedSuccess && (
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#8CE1BC]/20 border border-[#8CE1BC]/50 text-[#12724F] text-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="w-5.5 h-5.5 shrink-0 text-[#12724F]" />
            <div>
              <p className="font-semibold text-base">Validated Successfully</p>
              <p className="text-xs opacity-90">Form inputs passed React Hook Form validation.</p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="mt-1 inline-flex items-center justify-center py-2 px-4 bg-[#12724F] text-white rounded-xl font-bold text-xs hover:bg-[#0E5B3F] transition-all shadow-xs"
          >
            Launch Acme Cloud Demo Dashboard →
          </a>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Organization Name Field (Icon: FiBriefcase in #2265EF blue) */}
        <Input
          {...register("organizationName")}
          label="Organization Name"
          type="text"
          autoComplete="organization"
          icon={<FiBriefcase className="w-5 h-5 text-[#2265EF]" />}
          error={errors.organizationName?.message}
          helperText="e.g. acme-corp"
        />

        {/* Work Email Field (Icon: FiMail in #2265EF blue) */}
        <Input
          {...register("email")}
          label="Work Email"
          type="email"
          autoComplete="email"
          icon={<FiMail className="w-5 h-5 text-[#2265EF]" />}
          error={errors.email?.message}
          helperText="name@company.com"
        />

        {/* Password Field (Icon: FiLock in #2265EF blue) */}
        <div className="space-y-2">
          <Input
            {...register("password")}
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            icon={<FiLock className="w-5 h-5 text-[#2265EF]" />}
            error={errors.password?.message}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="text-slate-400 hover:text-[#2265EF] transition-colors p-1 rounded-md focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            }
          />
          
          {/* Tightly connected Forgot Password action */}
          <div className="flex items-center justify-end pt-0.5">
            <a
              href="#forgot-password"
              onClick={(e) => e.preventDefault()}
              className="text-xs sm:text-sm font-semibold text-[#2265EF] hover:text-[#1B55CD] hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#2265EF] rounded-xs"
            >
              Forgot password?
            </a>
          </div>
        </div>

        {/* Primary CTA Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          className="w-full mt-3 h-13 text-base font-bold shadow-md shadow-[#2265EF]/20"
        >
          Sign In
        </Button>
      </form>

      {/* Footer Sign-up Option */}
      <div className="pt-5 border-t border-slate-100 text-center space-y-2.5">
        <p className="text-sm sm:text-base text-slate-600 font-medium">
          Don’t have an account?{" "}
          <a
            href="#signup"
            onClick={(e) => e.preventDefault()}
            className="font-bold text-[#2265EF] hover:text-[#1B55CD] hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#2265EF] rounded-xs"
          >
            Sign up
          </a>
        </p>
        <p className="text-xs text-slate-400 font-normal leading-relaxed">
          Protected by Enterprise SSO & 256-Bit SSL Encryption.
        </p>
      </div>
    </div>
  );
}
