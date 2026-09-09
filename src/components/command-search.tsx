"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { NAV } from "@/data/nav"
import { cn } from "@/lib/utils"

export function CommandSearch({ className }: { className?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return NAV
    return NAV.filter(
      (item) =>
        item.label.toLowerCase().includes(needle) ||
        item.hint.toLowerCase().includes(needle)
    )
  }, [q])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-[10px] border border-sidebar-border bg-white px-3 text-left text-[13px] text-muted-foreground",
          className
        )}
      >
        <Search className="size-3.5 shrink-0" />
        <span className="flex-1 truncate">Поиск по фабрике</span>
        <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/25 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-auto mt-[12vh] max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(11,102,195,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Раздел, ниша, касса…"
                className="h-10 w-full bg-transparent text-sm outline-none"
              />
            </div>
            <ul className="max-h-72 overflow-y-auto p-2">
              {results.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-sidebar-accent"
                      onClick={() => {
                        setOpen(false)
                        setQ("")
                        router.push(item.href)
                      }}
                    >
                      <Icon className="size-4 text-primary" />
                      <span>
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className="block text-[11px] text-muted-foreground">{item.hint}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">Ничего не найдено</li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  )
}
