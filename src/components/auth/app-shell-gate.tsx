"use client"

import { usePathname } from "next/navigation"
import { AppShell } from "@/components/app-shell"

/** На /login оболочка не нужна — только форма входа. */
export function AppShellGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === "/login" || pathname === "/login/") {
    return <>{children}</>
  }
  return <AppShell>{children}</AppShell>
}
