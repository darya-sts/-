/** Панель управления Mindmap. */

"use client"

import Link from "next/link"
import { RefreshCw, Settings2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useArchitectureStore } from "@/architecture/store"

export function ArchitectureToolbar() {
  const search = useArchitectureStore((s) => s.search)
  const setSearch = useArchitectureStore((s) => s.setSearch)
  const showGithub = useArchitectureStore((s) => s.showGithub)
  const setShowGithub = useArchitectureStore((s) => s.setShowGithub)
  const loading = useArchitectureStore((s) => s.loading)
  const scan = useArchitectureStore((s) => s.scan)
  const error = useArchitectureStore((s) => s.error)
  const graph = useArchitectureStore((s) => s.graph)

  return (
    <div className="flex flex-col gap-3 border-b bg-background/80 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => void scan()} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : undefined} />
          Сканировать заново
        </Button>
        <Button size="sm" variant="outline" render={<Link href="/architecture/settings/" />}>
          <Settings2 />
          Настройки
        </Button>
        <label className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={showGithub}
            onChange={(e) => setShowGithub(e.target.checked)}
            className="accent-primary"
          />
          Показать GitHub-репозитории
        </label>
      </div>
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени узла…"
          className="pl-8"
        />
      </div>
      <div className="w-full text-[11px] text-muted-foreground sm:w-auto sm:text-right">
        {graph ? (
          <span>
            {graph.objects.length} объектов · {new Date(graph.scannedAt).toLocaleString("ru-RU")}
          </span>
        ) : (
          <span>Карта ещё не построена</span>
        )}
        {error ? <span className="mt-0.5 block text-amber-400">{error}</span> : null}
      </div>
    </div>
  )
}
