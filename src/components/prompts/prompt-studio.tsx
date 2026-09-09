"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, History, Map, Send, Sparkles } from "lucide-react"
import { ComposePanel } from "@/components/prompts/compose-panel"
import { DelegatePanel } from "@/components/prompts/delegate-panel"
import { DirectionMapPanel } from "@/components/prompts/direction-map-panel"
import { HistoryPanel } from "@/components/prompts/history-panel"
import { OrchestratorPanel } from "@/components/prompts/orchestrator-panel"
import { ReportPanel } from "@/components/prompts/report-panel"
import { IconTip } from "@/components/agents/icon-tip"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DEFAULT_AGENTS, DEFAULT_MEMORY_ITEMS, DEFAULT_PUBLICATIONS, PROMPT_AGENTS, PROMPT_MODELS } from "@/data/prompts"
import { composePrompt, slugify } from "@/lib/prompts/compose"
import { loadDirectionProfiles, removeDirection, resetDirection, upsertDirection } from "@/lib/prompts/directions"
import { downloadText, openPrintablePdf } from "@/lib/prompts/download"
import { adviseOrchestrator, type OrchestratorAdvice } from "@/lib/prompts/orchestrator"
import { createPrompt, delegatePrompt, loadPromptTasks, loadPrompts, updatePrompt } from "@/lib/prompts/store"
import { TIER_LABEL, type DelegateInput, type DirectionProfile, type PromptRecord, type PromptTaskRecord } from "@/lib/prompts/types"
import { TEXTAREA_CLASS } from "@/components/tasks/field-styles"

type Tab = "create" | "history" | "map"
type Step = "compose" | "delegate" | "done"
type Resolution = "keep" | "switch" | "mix"

function defaultDelegate(): DelegateInput {
  const agentRoles: Record<string, string> = {}
  for (const agent of PROMPT_AGENTS) agentRoles[agent.id] = agent.defaultRole
  return {
    agents: [...DEFAULT_AGENTS],
    agentRoles,
    modelTier: "balanced",
    modelId: "composer-2.5",
    publications: [...DEFAULT_PUBLICATIONS],
    saveToMemory: true,
    memoryItems: [...DEFAULT_MEMORY_ITEMS],
    priority: "standard",
  }
}

function applyAdvice(current: DelegateInput, advice: OrchestratorAdvice): DelegateInput {
  const models = PROMPT_MODELS.filter((model) => model.tier === advice.modelTier)
  const modelId = models.some((model) => model.id === advice.modelId) ? advice.modelId : models[0]?.id ?? advice.modelId
  return {
    ...current,
    agents: advice.agents.length ? advice.agents : current.agents,
    modelTier: advice.modelTier,
    modelId,
  }
}

export function PromptStudio() {
  const [tab, setTab] = useState<Tab>("create")
  const [step, setStep] = useState<Step>("compose")
  const [request, setRequest] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [directions, setDirections] = useState<string[]>([])
  const [profiles, setProfiles] = useState<DirectionProfile[]>([])
  const [prompt, setPrompt] = useState<PromptRecord | null>(null)
  const [history, setHistory] = useState<PromptRecord[]>([])
  const [tasks, setTasks] = useState<PromptTaskRecord[]>([])
  const [query, setQuery] = useState("")
  const [directionFilter, setDirectionFilter] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [delegate, setDelegate] = useState<DelegateInput>(defaultDelegate)
  const [pdfName, setPdfName] = useState("")
  const [resultMd, setResultMd] = useState("")
  const [resultPaths, setResultPaths] = useState<string[]>([])
  const [advice, setAdvice] = useState<OrchestratorAdvice | null>(null)
  const [mismatchResolved, setMismatchResolved] = useState(false)

  useEffect(() => {
    setHistory(loadPrompts())
    setTasks(loadPromptTasks())
    setProfiles(loadDirectionProfiles())
  }, [])

  const modelsForTier = useMemo(() => PROMPT_MODELS.filter((model) => model.tier === delegate.modelTier), [delegate.modelTier])
  useEffect(() => {
    if (modelsForTier.length && !modelsForTier.some((model) => model.id === delegate.modelId)) {
      setDelegate((current) => ({ ...current, modelId: modelsForTier[0].id }))
    }
  }, [delegate.modelId, modelsForTier])

  function refresh() {
    setHistory(loadPrompts())
    setTasks(loadPromptTasks())
    setProfiles(loadDirectionProfiles())
  }

  function toggleDirection(id: string) {
    setDirections((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function extrasFromAdvice(nextAdvice: OrchestratorAdvice, nextDirections: string[]) {
    return {
      directions: nextDirections.map((id) => ({ id, label: profiles.find((item) => item.id === id)?.label ?? id })),
      skills: nextAdvice.skills,
      rules: nextAdvice.rules,
      recommendedTier: nextAdvice.modelTier,
      modelId: nextAdvice.modelId,
    }
  }

  function runAdvice(nextDirections: string[], nextResolution: Resolution) {
    return adviseOrchestrator(nextDirections, request, profiles, nextResolution)
  }

  function onCompose() {
    if (directions.length === 0) {
      setError("Выберите хотя бы одно направление")
      return
    }
    setError(null)
    setBusy(true)
    try {
      const nextAdvice = runAdvice(directions, "keep")
      const composed = composePrompt(request, title || undefined, extrasFromAdvice(nextAdvice, directions))
      setTitle(composed.title)
      setBody(composed.body)
      setAdvice(nextAdvice)
      setMismatchResolved(!nextAdvice.mismatch)
      const saved = createPrompt({
        title: composed.title,
        request,
        body: composed.body,
        recommendedTier: nextAdvice.modelTier,
        directions,
      })
      setPrompt(saved)
      setDelegate((current) => applyAdvice(current, nextAdvice))
      setPdfName(`${slugify(composed.title)}.pdf`)
      setStep("compose")
      refresh()
    } finally {
      setBusy(false)
    }
  }

  function applyResolution(next: Resolution) {
    const preview = runAdvice(directions, next)
    const nextDirections =
      next === "switch" && preview.detected.length
        ? preview.detected
        : next === "mix"
          ? [...new Set([...directions, ...preview.detected])]
          : directions
    const nextAdvice = adviseOrchestrator(nextDirections, request, profiles, "keep")
    const composed = composePrompt(request, title || undefined, extrasFromAdvice(nextAdvice, nextDirections))
    setDirections(nextDirections)
    setTitle(composed.title)
    setBody(composed.body)
    setAdvice(nextAdvice)
    setMismatchResolved(true)
    setDelegate((current) => applyAdvice(current, nextAdvice))
    if (prompt) {
      const updated = updatePrompt(prompt.id, {
        title: composed.title,
        body: composed.body,
        directions: nextDirections,
        recommendedTier: nextAdvice.modelTier,
      })
      if (updated) setPrompt(updated)
    }
    refresh()
  }

  function onSavePdf() {
    if (!prompt) return
    const latest = updatePrompt(prompt.id, { title, body, directions }) ?? prompt
    downloadText(`${slugify(latest.title)}.md`, latest.body, "text/markdown")
    openPrintablePdf(latest.title, `${latest.request}\n\n${latest.body}`)
  }

  function onDelegate() {
    if (!prompt) return
    if (!delegate.agents.length) {
      setError("Выберите хотя бы одного агента")
      return
    }
    if (!delegate.publications.length) {
      setError("Выберите способ публикации")
      return
    }
    setError(null)
    setBusy(true)
    try {
      const latest = updatePrompt(prompt.id, { title, body, directions }) ?? { ...prompt, title, body, directions }
      const result = delegatePrompt(latest, { ...delegate, pdfFileName: pdfName || undefined })
      if (delegate.publications.includes("markdown") || delegate.publications.includes("project-file") || delegate.publications.includes("git") || delegate.publications.includes("chat")) {
        downloadText(`${slugify(latest.title)}.md`, result.packageMarkdown, "text/markdown")
      }
      if (delegate.publications.includes("pdf")) {
        openPrintablePdf(latest.title, result.packageMarkdown)
      }
      setResultMd(result.packageMarkdown)
      setResultPaths(result.outputPaths)
      setPrompt({ ...latest, status: "delegated" })
      setStep("done")
      refresh()
    } finally {
      setBusy(false)
    }
  }

  function openFromHistory(item: PromptRecord) {
    const nextAdvice = adviseOrchestrator(item.directions ?? [], item.request, profiles, "keep")
    setPrompt(item)
    setTitle(item.title)
    setRequest(item.request)
    setBody(item.body)
    setDirections(item.directions ?? [])
    setAdvice(nextAdvice)
    setMismatchResolved(!nextAdvice.mismatch)
    setDelegate((current) => applyAdvice({ ...current, modelTier: item.recommendedTier }, nextAdvice))
    setPdfName(`${slugify(item.title)}.pdf`)
    setTab("create")
    setStep("compose")
    setResultMd("")
    setResultPaths([])
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[28px] leading-tight tracking-tight">Промты</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Составьте структурированный промт, выберите направления — оркестратор подскажет агентов, навыки и модель. Данные в браузере, без сервера.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Разделы промтов">
          <Button type="button" size="sm" variant={tab === "create" ? "default" : "outline"} aria-selected={tab === "create"} onClick={() => setTab("create")}>
            <Sparkles />
            Создать
          </Button>
          <Button type="button" size="sm" variant={tab === "history" ? "default" : "outline"} aria-selected={tab === "history"} data-testid="prompts-history-tab" onClick={() => setTab("history")}>
            <History />
            История
          </Button>
          <Button type="button" size="sm" variant={tab === "map" ? "default" : "outline"} aria-selected={tab === "map"} data-testid="prompts-map-tab" onClick={() => setTab("map")}>
            <Map />
            Карта
          </Button>
        </div>
      </div>

      {error ? <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      {tab === "history" ? (
        <HistoryPanel
          prompts={history}
          tasks={tasks}
          query={query}
          directionFilter={directionFilter}
          profiles={profiles}
          onQuery={setQuery}
          onDirectionFilter={setDirectionFilter}
          onOpen={openFromHistory}
        />
      ) : tab === "map" ? (
        <DirectionMapPanel
          profiles={profiles}
          onSave={(id, patch) => {
            setProfiles(upsertDirection({ ...patch, id }))
          }}
          onCreate={(patch) => {
            setProfiles(upsertDirection(patch))
          }}
          onRemove={(id) => {
            setProfiles(removeDirection(id))
          }}
          onReset={(id) => {
            setProfiles(resetDirection(id))
          }}
        />
      ) : (
        <div className="grid gap-4">
          <ComposePanel
            request={request}
            title={title}
            directions={directions}
            profiles={profiles}
            busy={busy}
            onRequest={setRequest}
            onTitle={setTitle}
            onToggleDirection={toggleDirection}
            onCompose={onCompose}
          />

          {body && prompt && advice ? (
            <OrchestratorPanel
              advice={advice}
              profiles={profiles}
              resolved={mismatchResolved}
              onKeep={() => applyResolution("keep")}
              onSwitch={() => applyResolution("switch")}
              onMix={() => applyResolution("mix")}
            />
          ) : null}

          {body ? (
            <Card>
              <CardContent>
                <label className="grid gap-1 text-sm">
                  <span className="text-xs text-muted-foreground">
                    Готовый промт · тариф: <strong>{TIER_LABEL[advice?.modelTier ?? delegate.modelTier]}</strong>
                  </span>
                  <textarea
                    className={`${TEXTAREA_CLASS} min-h-40 font-mono text-xs`}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    aria-label="Текст промта"
                    data-testid="prompt-body"
                  />
                </label>
              </CardContent>
            </Card>
          ) : null}

          {body && prompt ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input className="w-56" value={pdfName} onChange={(event) => setPdfName(event.target.value)} placeholder="имя.pdf" aria-label="Имя PDF" />
              <IconTip label="Скачать Markdown и открыть печать в PDF">
                <Button type="button" variant="outline" disabled={busy} data-testid="save-prompt-pdf" onClick={onSavePdf}>
                  <Download />
                  Сохранить PDF
                </Button>
              </IconTip>
              <Button type="button" variant="secondary" data-testid="open-delegate" onClick={() => setStep("delegate")}>
                <Send />
                Передать в Cursor
              </Button>
            </div>
          ) : null}

          {step !== "compose" && prompt ? (
            <DelegatePanel
              value={delegate}
              onChange={setDelegate}
              onSubmit={onDelegate}
              busy={busy}
              highlightAgents={advice?.highlightAgents ?? advice?.agents}
              recommendedModelId={advice?.modelId}
              skills={advice?.skills}
              rules={advice?.rules}
            />
          ) : null}

          {step === "done" ? (
            <ReportPanel modelId={delegate.modelId} modelTier={delegate.modelTier} paths={resultPaths} markdown={resultMd} />
          ) : null}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">G затем Q — этот раздел. Карта направлений редактируется во вкладке «Карта», без внешнего API.</p>
    </div>
  )
}
