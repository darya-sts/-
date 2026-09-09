"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { STATUS_LABEL, type PromptRecord, type PromptTaskRecord } from "@/lib/prompts/types"

export function HistoryPanel({
  prompts,
  tasks,
  query,
  onQuery,
  onOpen,
}: {
  prompts: PromptRecord[]
  tasks: PromptTaskRecord[]
  query: string
  onQuery: (value: string) => void
  onOpen: (prompt: PromptRecord) => void
}) {
  const needle = query.trim().toLowerCase()
  const visiblePrompts = prompts.filter((item) => !needle || `${item.title} ${item.request}`.toLowerCase().includes(needle))
  const visibleTasks = tasks.filter((item) => !needle || `${item.promptTitle} ${item.modelId}`.toLowerCase().includes(needle))

  return (
    <div className="grid gap-4">
      <Input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Поиск по истории" aria-label="Поиск по истории промтов" />
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
