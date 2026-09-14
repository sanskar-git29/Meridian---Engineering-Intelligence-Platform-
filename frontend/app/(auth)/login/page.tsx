import { Metadata } from "next";
import { AuthIllustration } from "@/features/auth/components/AuthIllustration";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign In | Meridian Engineering Intelligence Platform",
  description: "Access your organization workspace and engineering tools securely.",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-[#E5EFFF] via-[#EDF3FF] to-[#F4F8FF] flex items-center justify-center p-3 sm:p-6 lg:p-8 selection:bg-[#E5EFFF] selection:text-[#2265EF] overflow-hidden">
      {/* 50 / 50 Padded Split Screen Container */}
      <div className="relative z-10 flex flex-col md:flex-row w-full min-h-[calc(100vh-3rem)] max-w-[1600px] bg-white rounded-3xl overflow-hidden shadow-2xl shadow-[#2265EF]/10 border border-[#E5EFFF]/80">
        {/* Left Side: Login Form Section (50% on desktop) */}
        <div className="flex flex-col justify-center items-center md:w-1/2 w-full p-6 sm:p-10 lg:p-14 xl:p-16 bg-white border-r border-slate-100">
          <div className="w-full max-w-lg">
            <LoginForm />
          </div>
        </div>

        {/* Right Side: Image Illustration Section (50% on desktop) */}
        <div className="hidden md:flex md:w-1/2 relative flex-shrink-0 min-h-[500px]">
          <AuthIllustration />
        </div>
      </div>
    </main>
  );
}
