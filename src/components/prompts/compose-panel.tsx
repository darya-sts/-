"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { DirectionProfile } from "@/lib/prompts/types"
import { TEXTAREA_CLASS } from "@/components/tasks/field-styles"
import { cn } from "@/lib/utils"

export function ComposePanel({
  request,
  title,
  directions,
  profiles,
  busy,
  onRequest,
  onTitle,
  onToggleDirection,
  onCompose,
}: {
  request: string
  title: string
  directions: string[]
  profiles: DirectionProfile[]
  busy: boolean
  onRequest: (value: string) => void
  onTitle: (value: string) => void
  onToggleDirection: (id: string) => void
  onCompose: () => void
}) {
  const canCompose = request.trim().length >= 3 && directions.length > 0
  return (
    <Card>
      <CardContent className="grid gap-3">
        <h2 className="text-sm font-bold">1. Запрос → промт</h2>
        <fieldset className="grid gap-2">
          <legend className="text-xs text-muted-foreground">Направления (одно или несколько)</legend>
          <div className="flex flex-wrap gap-2" data-testid="prompt-directions">
            {profiles.map((profile) => {
              const on = directions.includes(profile.id)
              return (
                <button
                  key={profile.id}
                  type="button"
                  data-testid={`direction-${profile.id}`}
                  aria-pressed={on}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-white hover:bg-sidebar-accent"
                  )}
                  onClick={() => onToggleDirection(profile.id)}
                >
                  {profile.label}
                </button>
              )
            })}
          </div>
          {directions.length === 0 ? (
            <p className="text-xs text-muted-foreground">Выберите хотя бы одно направление — по нему оркестратор подберёт агентов, навыки и модель.</p>
          ) : null}
        </fieldset>
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">Запрос</span>
          <textarea
            className={TEXTAREA_CLASS}
            value={request}
            onChange={(event) => onRequest(event.target.value)}
            placeholder="Опишите задачу для Cursor…"
            aria-label="Запрос для промта"
            data-testid="prompt-request"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">Заголовок (необязательно)</span>
          <Input value={title} onChange={(event) => onTitle(event.target.value)} aria-label="Заголовок промта" />
        </label>
        <Button type="button" disabled={busy || !canCompose} data-testid="compose-prompt" onClick={onCompose}>
          <Sparkles />
          Составить промт
        </Button>
      </CardContent>
    </Card>
  )
}
