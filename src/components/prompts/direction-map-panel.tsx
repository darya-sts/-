"use client"

import { Plus, RotateCcw, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PROMPT_AGENTS, PROMPT_MODELS } from "@/data/prompts"
import { TEXTAREA_CLASS, FIELD_CLASS } from "@/components/tasks/field-styles"
import { TIER_LABEL, type DirectionProfile, type ModelTier } from "@/lib/prompts/types"
import { cn } from "@/lib/utils"

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
}

type DirectionDraft = {
  label: string
  agents: string[]
  skillsText: string
  rulesText: string
  keywordsText: string
  modelTier: ModelTier
  modelId: string
}

function emptyDraft(): DirectionDraft {
  return {
    label: "",
    agents: [],
    skillsText: "",
    rulesText: "",
    keywordsText: "",
    modelTier: "balanced",
    modelId: "composer-2.5",
  }
}

export function DirectionMapPanel({
  profiles,
  onSave,
  onCreate,
  onRemove,
  onReset,
}: {
  profiles: DirectionProfile[]
  onSave: (id: string, patch: Omit<DirectionProfile, "id" | "builtin">) => void
  onCreate: (patch: Omit<DirectionProfile, "id" | "builtin">) => void
  onRemove: (id: string) => void
  onReset: (id: string) => void
}) {
  const [openId, setOpenId] = useState<string | "new" | null>(null)
  const [draft, setDraft] = useState(emptyDraft)

  const models = useMemo(() => PROMPT_MODELS.filter((model) => model.tier === draft.modelTier), [draft.modelTier])

  function startEdit(profile: DirectionProfile) {
    setOpenId(profile.id)
    setDraft({
      label: profile.label,
      agents: [...profile.agents],
      skillsText: profile.skills.join("\n"),
      rulesText: profile.rules.join("\n"),
      keywordsText: profile.keywords.join("\n"),
      modelTier: profile.modelTier,
      modelId: profile.modelId,
    })
  }

  function startCreate() {
    setOpenId("new")
    setDraft(emptyDraft())
  }

  function toggleAgent(id: string) {
    setDraft((current) => ({
      ...current,
      agents: current.agents.includes(id) ? current.agents.filter((item) => item !== id) : [...current.agents, id],
    }))
  }

  function commit() {
    if (!draft.label.trim()) return
    const payload = {
      label: draft.label.trim(),
      agents: draft.agents,
      skills: lines(draft.skillsText),
      rules: lines(draft.rulesText),
      keywords: lines(draft.keywordsText),
      modelTier: draft.modelTier,
      modelId: draft.modelId,
    }
    if (openId === "new") onCreate(payload)
    else if (openId) onSave(openId, payload)
    setOpenId(null)
    setDraft(emptyDraft())
  }

  return (
    <div className="grid gap-4" data-testid="direction-map">
      <p className="text-sm text-muted-foreground">
        Карта направлений задаёт агентов, навыки, правила и модель. Встроенные нельзя удалить — их можно править и сбрасывать. Свои направления добавляются здесь.
      </p>
      <div className="flex justify-end">
        <Button type="button" size="sm" data-testid="add-direction" onClick={startCreate}>
          <Plus />
          Новое направление
        </Button>
      </div>
      {openId === "new" ? (
        <Card>
          <CardContent className="grid gap-3">
            <h2 className="text-sm font-bold">Новое направление</h2>
            <DirectionForm draft={draft} models={models} onChange={setDraft} onToggleAgent={toggleAgent} />
            <div className="flex gap-2">
              <Button type="button" data-testid="save-new-direction" onClick={commit}>
                Сохранить
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpenId(null)}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      {profiles.map((profile) => (
        <Card key={profile.id}>
          <CardContent className="grid gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold">{profile.label}</h2>
                <p className="text-xs text-muted-foreground">
                  {profile.builtin ? "встроенное" : "своё"} · {profile.agents.join(", ") || "агенты не заданы"} · {profile.modelId}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button type="button" size="sm" variant="outline" data-testid={`edit-direction-${profile.id}`} onClick={() => startEdit(profile)}>
                  Изменить
                </Button>
                {profile.builtin ? (
                  <Button type="button" size="sm" variant="ghost" aria-label={`Сбросить ${profile.label}`} onClick={() => onReset(profile.id)}>
                    <RotateCcw />
                  </Button>
                ) : (
                  <Button type="button" size="icon-xs" variant="ghost" aria-label={`Удалить ${profile.label}`} onClick={() => onRemove(profile.id)}>
                    <Trash2 />
                  </Button>
                )}
              </div>
            </div>
            {openId === profile.id ? (
              <div className="grid gap-3">
                <DirectionForm draft={draft} models={models} onChange={setDraft} onToggleAgent={toggleAgent} />
                <div className="flex gap-2">
                  <Button type="button" data-testid={`save-direction-${profile.id}`} onClick={commit}>
                    Сохранить
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setOpenId(null)}>
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-2 text-sm">
                <p>
                  <span className="text-xs text-muted-foreground">Ключевые слова: </span>
                  {profile.keywords.join(", ") || "—"}
                </p>
                {profile.skills[0] ? <p className="text-muted-foreground">{profile.skills[0]}</p> : null}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DirectionForm({
  draft,
  models,
  onChange,
  onToggleAgent,
}: {
  draft: DirectionDraft
  models: typeof PROMPT_MODELS
  onChange: (next: DirectionDraft) => void
  onToggleAgent: (id: string) => void
}) {
  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="text-xs text-muted-foreground">Название</span>
        <Input value={draft.label} onChange={(event) => onChange({ ...draft, label: event.target.value })} data-testid="direction-label" />
      </label>
      <fieldset className="grid gap-2">
        <legend className="text-xs text-muted-foreground">Агенты</legend>
        <div className="grid gap-1 sm:grid-cols-2">
          {PROMPT_AGENTS.map((agent) => {
            const on = draft.agents.includes(agent.id)
            return (
              <label key={agent.id} className={cn("flex items-center gap-2 rounded-lg bg-white/80 px-2 py-1 text-sm", on && "ring-1 ring-primary")}>
                <input type="checkbox" checked={on} onChange={() => onToggleAgent(agent.id)} />
                {agent.name}
              </label>
            )
          })}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">Тариф</span>
          <select
            className={FIELD_CLASS}
            value={draft.modelTier}
            onChange={(event) => {
              const modelTier = event.target.value as ModelTier
              const nextModels = PROMPT_MODELS.filter((model) => model.tier === modelTier)
              onChange({
                ...draft,
                modelTier,
                modelId: nextModels.some((model) => model.id === draft.modelId) ? draft.modelId : nextModels[0]?.id ?? draft.modelId,
              })
            }}
          >
            {(Object.keys(TIER_LABEL) as ModelTier[]).map((tier) => (
              <option key={tier} value={tier}>
                {TIER_LABEL[tier]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">Модель</span>
          <select className={FIELD_CLASS} value={draft.modelId} onChange={(event) => onChange({ ...draft, modelId: event.target.value })}>
            {(models.length ? models : PROMPT_MODELS).map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="text-xs text-muted-foreground">Навыки (по строке)</span>
        <textarea
          className={TEXTAREA_CLASS}
          value={draft.skillsText}
          onChange={(event) => onChange({ ...draft, skillsText: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-xs text-muted-foreground">Правила (по строке)</span>
        <textarea
          className={TEXTAREA_CLASS}
          value={draft.rulesText}
          onChange={(event) => onChange({ ...draft, rulesText: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-xs text-muted-foreground">Ключевые слова (по строке)</span>
        <textarea
          className={`${TEXTAREA_CLASS} min-h-20`}
          value={draft.keywordsText}
          onChange={(event) => onChange({ ...draft, keywordsText: event.target.value })}
          data-testid="direction-keywords"
        />
      </label>
    </div>
  )
}
