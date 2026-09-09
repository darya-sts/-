"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Settings } from "lucide-react"
import Link from "next/link"
import { AgentCard } from "@/components/agents/agent-card"
import { AgentFilters, matchesSkillFilter } from "@/components/agents/agent-filters"
import { IconTip } from "@/components/agents/icon-tip"
import { Button } from "@/components/ui/button"
import { loadAgentsCatalog } from "@/lib/agents/store"
import type { AgentRecord, AgentStatus } from "@/lib/agents/types"

export function AgentsDashboard() {
  const router = useRouter()
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [busy, setBusy] = useState(true)
  const [fromCache, setFromCache] = useState(false)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<AgentStatus | "all">("all")
  const [memory, setMemory] = useState<"all" | "yes" | "no">("all")
  const [skills, setSkills] = useState<"all" | "0-1" | "2-3" | "4+">("all")

  async function load(force = false) {
    setBusy(true)
    const result = await loadAgentsCatalog(force)
    setAgents(result.catalog.agents)
    setFromCache(result.fromCache)
    setBusy(false)
  }

  useEffect(() => {
    void load(false)
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === "/") {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('input[aria-label="Поиск агентов"]')?.focus()
      }
      if (event.key.toLowerCase() === "r") void load(true)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return agents.filter((agent) => {
      if (status !== "all" && agent.status !== status) return false
      if (memory === "yes" && !agent.memoryConnected) return false
      if (memory === "no" && agent.memoryConnected) return false
      if (!matchesSkillFilter(agent.skills.length, skills)) return false
      if (!needle) return true
      return `${agent.name} ${agent.summary} ${agent.description}`.toLowerCase().includes(needle)
    })
  }, [agents, memory, query, skills, status])

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[28px] leading-tight tracking-tight">Агенты и Боты</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Панель Cursor-агентов, скилов и правил фабрики. Каталог сканируется из репозитория, кэш 5 минут.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <IconTip label="Принудительно обновить каталог (R)">
            <Button type="button" variant="outline" disabled={busy} data-testid="sync-agents" onClick={() => void load(true)}>
              <RefreshCw className={busy ? "animate-spin" : undefined} />
              Синхронизация с Cursor
            </Button>
          </IconTip>
          <IconTip label="Репозитории, кэш и экспорт JSON">
            <Button type="button" variant="outline" render={<Link href="/agents/settings/" />}>
              <Settings />
              Настройки
            </Button>
          </IconTip>
        </div>
      </div>

      <AgentFilters
        query={query}
        status={status}
        memory={memory}
        skills={skills}
        onQuery={setQuery}
        onStatus={setStatus}
        onMemory={setMemory}
        onSkills={setSkills}
      />

      {busy ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-live="polite">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl bg-card" />
          ))}
          <p className="sr-only">Загрузка каталога…</p>
        </div>
      ) : null}
      {!busy && fromCache ? <p className="text-xs text-muted-foreground">Показан локальный кэш (срок задаётся в настройках).</p> : null}

      {!busy && agents.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-sm" data-testid="agents-empty">
          <p className="font-semibold">Пока нет ни одного агента</p>
          <p className="mt-2 text-muted-foreground">
            Добавьте запись в <code>src/data/agents.ts</code> или skill в <code>.cursor/</code>, соберите{" "}
            <code>public/api/agents.json</code> и нажмите «Синхронизация с Cursor».
          </p>
        </div>
      ) : null}

      {!busy && agents.length > 0 && visible.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-sm" data-testid="agents-filtered-empty">
          <p className="font-semibold">Ничего не найдено</p>
          <p className="mt-2 text-muted-foreground">Сбросьте поиск и фильтры по статусу, памяти или числу скилов.</p>
        </div>
      ) : null}

      {!busy && visible.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onSelect={(id) => router.push(`/agents/${id}/`)} />
          ))}
        </div>
      ) : null}
      <p className="text-[11px] text-muted-foreground">/ — поиск, R — синхронизация, G затем A — этот раздел.</p>
    </div>
  )
}
