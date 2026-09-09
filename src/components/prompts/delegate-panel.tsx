"use client"

import { Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MEMORY_OPTIONS, PROMPT_AGENTS, PROMPT_MODELS, PUBLICATION_OPTIONS } from "@/data/prompts"
import { FIELD_CLASS } from "@/components/tasks/field-styles"
import { TIER_LABEL, type DelegateInput, type ModelTier } from "@/lib/prompts/types"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
}

export function DelegatePanel({
  value,
  onChange,
  onSubmit,
  busy,
  highlightAgents = [],
  recommendedModelId,
  skills = [],
  rules = [],
}: {
  value: DelegateInput
  onChange: (next: DelegateInput) => void
  onSubmit: () => void
  busy: boolean
  highlightAgents?: string[]
  recommendedModelId?: string
  skills?: string[]
  rules?: string[]
}) {
  const [allAgents, setAllAgents] = useState(false)
  const models = useMemo(() => PROMPT_MODELS.filter((model) => model.tier === value.modelTier), [value.modelTier])
  const highlight = new Set(highlightAgents)
  const agents = allAgents
    ? PROMPT_AGENTS
    : PROMPT_AGENTS.filter(
        (agent) =>
          ["coding", "explore", "frontend", "testing", "debug", "writing"].includes(agent.id) ||
          value.agents.includes(agent.id) ||
          highlight.has(agent.id)
      )

  return (
    <Card className="chat-message-enter">
      <CardContent className="grid gap-5">
        <h2 className="text-sm font-bold">2. Чек-лист делегирования</h2>
        {skills.length || rules.length ? (
          <div className="grid gap-2 rounded-xl bg-white/80 p-3">
            {skills.length ? (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Навыки из карты</p>
                <div className="flex flex-wrap gap-1">
                  {skills.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {rules.length ? (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Правила</p>
                <div className="flex flex-wrap gap-1">
                  {rules.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <section className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Агенты</h3>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAllAgents((open) => !open)}>
              {allAgents ? "Свернуть" : "Все агенты"}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {agents.map((agent) => {
              const on = value.agents.includes(agent.id)
              const recommended = highlight.has(agent.id)
              return (
                <label
                  key={agent.id}
                  data-testid={`delegate-agent-${agent.id}`}
                  data-recommended={recommended ? "true" : "false"}
                  className={cn(
                    "rounded-xl bg-white/80 p-3 text-sm",
                    on && "ring-1 ring-primary",
                    recommended && "ring-2 ring-primary"
                  )}
                >
                  <span className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => onChange({ ...value, agents: toggle(value.agents, agent.id) })}
                    />
                    <span>
                      <span className="flex flex-wrap items-center gap-1">
                        <span className="font-medium">{agent.name}</span>
                        {recommended ? (
                          <Badge variant="default" data-testid={`recommended-agent-${agent.id}`}>
                            рекомендовано
                          </Badge>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{agent.description}</span>
                    </span>
                  </span>
                  {on ? (
                    <Input
                      className="mt-2"
                      value={value.agentRoles[agent.id] || ""}
                      onChange={(event) => onChange({ ...value, agentRoles: { ...value.agentRoles, [agent.id]: event.target.value } })}
                      placeholder="Роль в задании"
                      aria-label={`Роль ${agent.name}`}
                    />
                  ) : null}
                </label>
              )
            })}
          </div>
        </section>

        <section className="grid gap-2">
          <h3 className="text-sm font-semibold">Модель</h3>
          <div className="flex flex-wrap gap-2">
            {(["economy", "balanced", "fast"] as ModelTier[]).map((tier) => (
              <Button key={tier} type="button" size="sm" variant={value.modelTier === tier ? "default" : "outline"} onClick={() => onChange({ ...value, modelTier: tier })}>
                {TIER_LABEL[tier]}
              </Button>
            ))}
          </div>
          <div className="grid gap-2">
            {models.map((model) => {
              const recommended = recommendedModelId === model.id
              return (
                <label
                  key={model.id}
                  data-testid={`delegate-model-${model.id}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-xl bg-white/80 p-3 text-sm",
                    value.modelId === model.id && "ring-1 ring-primary",
                    recommended && "ring-2 ring-primary"
                  )}
                >
                  <input type="radio" name="prompt-model" checked={value.modelId === model.id} onChange={() => onChange({ ...value, modelId: model.id })} />
                  <span>
                    <span className="flex flex-wrap items-center gap-1">
                      <span className="font-medium">{model.name}</span>
                      {recommended ? <Badge variant="default">рекомендовано</Badge> : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      скорость {model.speed} · стоимость {model.cost} · {model.quality}
                    </span>
                    <span className="block text-xs text-muted-foreground">{model.recommendedFor}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </section>

        <section className="grid gap-2">
          <h3 className="text-sm font-semibold">Публикация</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {PUBLICATION_OPTIONS.map((option) => (
              <label key={option.id} className="flex items-start gap-2 rounded-xl bg-white/80 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={value.publications.includes(option.id)}
                  onChange={() => onChange({ ...value, publications: toggle(value.publications, option.id) })}
                />
                <span>
                  <span className="font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="grid gap-2">
          <h3 className="text-sm font-semibold">Память</h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={value.saveToMemory} onChange={(event) => onChange({ ...value, saveToMemory: event.target.checked })} />
            Сохранить в долговременную память браузера
          </label>
          {value.saveToMemory ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {MEMORY_OPTIONS.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value.memoryItems.includes(item.id)}
                    onChange={() => onChange({ ...value, memoryItems: toggle(value.memoryItems, item.id) })}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          ) : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Приоритет</span>
            <select
              className={FIELD_CLASS}
              value={value.priority}
              onChange={(event) => onChange({ ...value, priority: event.target.value as DelegateInput["priority"] })}
              aria-label="Приоритет задания"
            >
              <option value="urgent">Срочное</option>
              <option value="standard">Стандартное</option>
              <option value="background">Фоновое</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Дедлайн</span>
            <Input value={value.deadline ?? ""} onChange={(event) => onChange({ ...value, deadline: event.target.value })} placeholder="опционально" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Входные данные</span>
            <Input value={value.inputRef ?? ""} onChange={(event) => onChange({ ...value, inputRef: event.target.value })} placeholder="путь или ссылка" />
          </label>
        </section>

        <Button type="button" disabled={busy} data-testid="delegate-prompt" onClick={onSubmit}>
          <Send />
          Подтвердить и сформировать задание
        </Button>
      </CardContent>
    </Card>
  )
}
