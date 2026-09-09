"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MismatchBanner } from "@/components/prompts/mismatch-banner"
import { directionLabel } from "@/lib/prompts/directions"
import type { OrchestratorAdvice } from "@/lib/prompts/orchestrator"
import { TIER_LABEL, type DirectionProfile } from "@/lib/prompts/types"
import { PROMPT_AGENTS, PROMPT_MODELS } from "@/data/prompts"

export function OrchestratorPanel({
  advice,
  profiles,
  resolved,
  onKeep,
  onSwitch,
  onMix,
}: {
  advice: OrchestratorAdvice
  profiles: DirectionProfile[]
  resolved: boolean
  onKeep: () => void
  onSwitch: () => void
  onMix: () => void
}) {
  const selectedLabels = advice.selected.map((id) => directionLabel(id, profiles))
  const detectedLabels = advice.detected.map((id) => directionLabel(id, profiles))
  const model = PROMPT_MODELS.find((item) => item.id === advice.modelId)

  return (
    <Card data-testid="orchestrator-panel">
      <CardContent className="grid gap-3">
        <h2 className="text-sm font-bold">Оркестратор</h2>
        <p className="text-sm text-muted-foreground">
          Правила кабинета по карте направлений. LLM API не вызывается. Рекомендации можно поправить на шаге делегирования.
        </p>
        {advice.mismatch && !resolved ? (
          <MismatchBanner
            selectedLabels={selectedLabels}
            detectedLabels={detectedLabels}
            onKeep={onKeep}
            onSwitch={onSwitch}
            onMix={onMix}
          />
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Агенты</p>
            <div className="flex flex-wrap gap-1">
              {advice.agents.length
                ? advice.agents.map((id) => (
                    <Badge key={id} variant="secondary">
                      {PROMPT_AGENTS.find((agent) => agent.id === id)?.name ?? id}
                    </Badge>
                  ))
                : <span className="text-xs text-muted-foreground">нет в карте</span>}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Модель</p>
            <p className="text-sm font-medium">
              {model?.name ?? advice.modelId} · {TIER_LABEL[advice.modelTier]}
            </p>
          </div>
        </div>
        {advice.skills.length ? (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Навыки</p>
            <ul className="list-inside list-disc text-sm" data-testid="orchestrator-skills">
              {advice.skills.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {advice.rules.length ? (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Правила</p>
            <ul className="list-inside list-disc text-sm" data-testid="orchestrator-rules">
              {advice.rules.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
