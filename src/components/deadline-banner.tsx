"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const DEADLINE = Date.UTC(2027, 1, 1)

export function DeadlineBanner() {
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => {
      const diff = DEADLINE - Date.now()
      setDays(Math.max(0, Math.ceil(diff / 86_400_000)))
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  const pct = days == null ? 62 : Math.min(100, Math.max(8, Math.round((1 - days / 180) * 100)))

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card px-4 py-3 shadow-[0_4px_20px_rgba(11,102,195,0.08)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          YPP до 1 февраля 2027
          {days != null ? <span className="text-muted-foreground"> · осталось {days} дней</span> : null}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8eef2]" aria-hidden="true">
          <i className="block h-full rounded-full bg-mcp" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="inline-flex w-fit items-center rounded-full bg-mcp px-2.5 py-1 text-[11px] font-bold text-white">
        на траектории
      </span>
    </div>
  )
}
