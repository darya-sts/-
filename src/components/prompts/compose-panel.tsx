"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TIER_LABEL, type ModelTier } from "@/lib/prompts/types"
import { TEXTAREA_CLASS } from "@/components/tasks/field-styles"

export function ComposePanel({
  request,
  title,
  body,
  recommendedTier,
  busy,
  onRequest,
  onTitle,
  onBody,
  onCompose,
}: {
  request: string
  title: string
  body: string
  recommendedTier: ModelTier
  busy: boolean
  onRequest: (value: string) => void
  onTitle: (value: string) => void
  onBody: (value: string) => void
  onCompose: () => void
}) {
  return (
    <Card>
      <CardContent className="grid gap-3">
        <h2 className="text-sm font-bold">1. Запрос → промт</h2>
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
        <Button type="button" disabled={busy || request.trim().length < 3} data-testid="compose-prompt" onClick={onCompose}>
          <Sparkles />
          Составить промт
        </Button>
        {body ? (
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">
              Готовый промт · тариф: <strong>{TIER_LABEL[recommendedTier]}</strong>
            </span>
            <textarea
              className={`${TEXTAREA_CLASS} min-h-56 font-mono text-xs`}
              value={body}
              onChange={(event) => onBody(event.target.value)}
              aria-label="Текст промта"
              data-testid="prompt-body"
            />
          </label>
        ) : null}
      </CardContent>
    </Card>
  )
}
