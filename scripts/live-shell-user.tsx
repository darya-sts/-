"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"

export function ShellUser({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAuth()
  const initial = (user?.email?.[0] ?? "N").toUpperCase()

  if (!user) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          NS
        </span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {initial}
        </span>
        <Button variant="outline" size="icon-sm" onClick={() => void logout()} aria-label="Выйти">
          <LogOut />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {initial}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{user.email}</span>
          <span className="block text-[11px] text-muted-foreground">сессия</span>
        </span>
      </div>
      <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => void logout()}>
        <LogOut />
        Выйти
      </Button>
    </div>
  )
}
