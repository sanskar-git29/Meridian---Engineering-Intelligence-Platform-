"use client";

import "@/lib/api/auth-interceptor";

export function ApiProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}