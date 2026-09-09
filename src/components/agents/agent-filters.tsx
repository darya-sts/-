"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FIELD_CLASS } from "@/components/tasks/field-styles"
import type { AgentStatus } from "@/lib/agents/types"

export function AgentFilters({
  query,
  status,
  memory,
  skills,
  onQuery,
  onStatus,
  onMemory,
  onSkills,
}: {
  query: string
  status: AgentStatus | "all"
  memory: "all" | "yes" | "no"
  skills: "all" | "0-1" | "2-3" | "4+"
  onQuery: (value: string) => void
  onStatus: (value: AgentStatus | "all") => void
  onMemory: (value: "all" | "yes" | "no") => void
  onSkills: (value: "all" | "0-1" | "2-3" | "4+") => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Поиск по названию и описанию"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          aria-label="Поиск агентов"
        />
      </div>
      <select className={FIELD_CLASS} value={status} aria-label="Фильтр по статусу" onChange={(event) => onStatus(event.target.value as AgentStatus | "all")}>
        <option value="all">Все статусы</option>
        <option value="active">Активен</option>
        <option value="development">В разработке</option>
        <option value="inactive">Неактивен</option>
      </select>
      <select className={FIELD_CLASS} value={memory} aria-label="Фильтр по памяти" onChange={(event) => onMemory(event.target.value as "all" | "yes" | "no")}>
        <option value="all">Память: все</option>
        <option value="yes">С памятью</option>
        <option value="no">Без памяти</option>
      </select>
      <select className={FIELD_CLASS} value={skills} aria-label="Фильтр по скилам" onChange={(event) => onSkills(event.target.value as "all" | "0-1" | "2-3" | "4+")}>
        <option value="all">Скилы: все</option>
        <option value="0-1">0–1 скил</option>
        <option value="2-3">2–3 скила</option>
        <option value="4+">4+ скила</option>
      </select>
    </div>
  )
}

export function matchesSkillFilter(count: number, skills: "all" | "0-1" | "2-3" | "4+") {
  if (skills === "all") return true
  if (skills === "0-1") return count <= 1
  if (skills === "2-3") return count >= 2 && count <= 3
  return count >= 4
}
