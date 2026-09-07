"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

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

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed">
          <span className="font-medium">Дедлайн YPP: 1 февраля 2027. </span>
          Для новых каналов порог рекламы удваивается до 8 000 часов или 20 млн Shorts.
          {days != null && (
            <span className="text-muted-foreground"> Осталось {days} дн.</span>
          )}
        </p>
      </div>
      <Link href="/monetization" className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline">
        Правила 2026
      </Link>
    </div>
  )
}
