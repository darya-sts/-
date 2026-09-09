"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { directionLabel } from "@/lib/prompts/directions"
import { STATUS_LABEL, type DirectionProfile, type PromptRecord, type PromptTaskRecord } from "@/lib/prompts/types"
import { cn } from "@/lib/utils"

export function HistoryPanel({
  prompts,
  tasks,
  query,
  directionFilter,
  profiles,
  onQuery,
  onDirectionFilter,
  onOpen,
}: {
  prompts: PromptRecord[]
  tasks: PromptTaskRecord[]
  query: string
  directionFilter: string[]
  profiles: DirectionProfile[]
  onQuery: (value: string) => void
  onDirectionFilter: (value: string[]) => void
  onOpen: (prompt: PromptRecord) => void
}) {
  const needle = query.trim().toLowerCase()
  const filterSet = new Set(directionFilter)
  const matchesDirections = (ids: string[]) => !filterSet.size || ids.some((id) => filterSet.has(id))
  const visiblePrompts = prompts.filter(
    (item) =>
      matchesDirections(item.directions ?? []) &&
      (!needle || `${item.title} ${item.request} ${(item.directions ?? []).join(" ")}`.toLowerCase().includes(needle))
  )
  const visibleTasks = tasks.filter(
    (item) =>
      matchesDirections(item.directions ?? []) &&
      (!needle || `${item.promptTitle} ${item.modelId} ${(item.directions ?? []).join(" ")}`.toLowerCase().includes(needle))
  )

  function toggleFilter(id: string) {
    onDirectionFilter(directionFilter.includes(id) ? directionFilter.filter((item) => item !== id) : [...directionFilter, id])
  }

  return (
    <div className="grid gap-4">
      <Input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Поиск по истории" aria-label="Поиск по истории промтов" />
      <div className="flex flex-wrap gap-2" data-testid="history-direction-filters">
        {profiles.map((profile) => {
          const on = directionFilter.includes(profile.id)
          return (
            <button
              key={profile.id}
              type="button"
              data-testid={`history-direction-${profile.id}`}
              aria-pressed={on}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-white hover:bg-sidebar-accent"
              )}
              onClick={() => toggleFilter(profile.id)}
            >
              {profile.label}
            </button>
          )
        })}
        {directionFilter.length ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => onDirectionFilter([])}>
            Сбросить фильтр
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="grid gap-2">
            <h2 className="text-sm font-bold">Промты</h2>
            {visiblePrompts.length === 0 ? (
              <p className="text-sm text-muted-foreground" data-testid="prompts-empty">
                {prompts.length === 0 ? "Пока нет промтов. Составьте первый на вкладке «Создать»." : "Ничего не найдено."}
              </p>
            ) : (
              visiblePrompts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-xl bg-white/80 px-3 py-2 text-left"
                  onClick={() => onOpen(item)}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.title}</span>
                    <Badge variant="outline">{STATUS_LABEL[item.status]}</Badge>
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {(item.directions ?? []).map((id) => (
                      <Badge key={id} variant="secondary">
                        {directionLabel(id, profiles)}
                      </Badge>
                    ))}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{item.request}</span>
                </button>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="grid gap-2">
            <h2 className="text-sm font-bold">Задания Cursor</h2>
            {visibleTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет делегированных заданий.</p>
            ) : (
              visibleTasks.map((item) => (
                <div key={item.id} className="rounded-xl bg-white/80 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.promptTitle}</span>
                    <Badge variant="secondary">{item.modelTier}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(item.directions ?? []).map((id) => (
                      <Badge key={id} variant="outline">
                        {directionLabel(id, profiles)}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.agents.join(", ")} · {new Date(item.createdAt).toLocaleString("ru-RU")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
