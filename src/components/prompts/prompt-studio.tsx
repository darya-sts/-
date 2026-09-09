"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, History, Send, Sparkles } from "lucide-react"
import { ComposePanel } from "@/components/prompts/compose-panel"
import { DelegatePanel } from "@/components/prompts/delegate-panel"
import { HistoryPanel } from "@/components/prompts/history-panel"
import { ReportPanel } from "@/components/prompts/report-panel"
import { IconTip } from "@/components/agents/icon-tip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DEFAULT_AGENTS, DEFAULT_MEMORY_ITEMS, DEFAULT_PUBLICATIONS, PROMPT_AGENTS, PROMPT_MODELS } from "@/data/prompts"
import { composePrompt, slugify } from "@/lib/prompts/compose"
import { downloadText, openPrintablePdf } from "@/lib/prompts/download"
import { createPrompt, delegatePrompt, loadPromptTasks, loadPrompts, updatePrompt } from "@/lib/prompts/store"
import type { DelegateInput, PromptRecord, PromptTaskRecord } from "@/lib/prompts/types"

type Tab = "create" | "history"
type Step = "compose" | "delegate" | "done"

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

export function PromptStudio() {
  const [tab, setTab] = useState<Tab>("create")
  const [step, setStep] = useState<Step>("compose")
  const [request, setRequest] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [prompt, setPrompt] = useState<PromptRecord | null>(null)
  const [history, setHistory] = useState<PromptRecord[]>([])
  const [tasks, setTasks] = useState<PromptTaskRecord[]>([])
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [delegate, setDelegate] = useState<DelegateInput>(defaultDelegate)
  const [pdfName, setPdfName] = useState("")
  const [resultMd, setResultMd] = useState("")
  const [resultPaths, setResultPaths] = useState<string[]>([])

  useEffect(() => {
    setHistory(loadPrompts())
    setTasks(loadPromptTasks())
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
  }

  function onCompose() {
    setError(null)
    setBusy(true)
    try {
      const composed = composePrompt(request, title || undefined)
      setTitle(composed.title)
      setBody(composed.body)
      setDelegate((current) => ({ ...current, modelTier: composed.recommendedTier }))
      const saved = createPrompt({
        title: composed.title,
        request,
        body: composed.body,
        recommendedTier: composed.recommendedTier,
      })
      setPrompt(saved)
      setPdfName(`${slugify(composed.title)}.pdf`)
      setStep("compose")
      refresh()
    } finally {
      setBusy(false)
    }
  }

  function onSavePdf() {
    if (!prompt) return
    const latest = updatePrompt(prompt.id, { title, body }) ?? prompt
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
      const latest = updatePrompt(prompt.id, { title, body }) ?? { ...prompt, title, body }
      const result = delegatePrompt(latest, { ...delegate, pdfFileName: pdfName || undefined })
      if (delegate.publications.includes("markdown") || delegate.publications.includes("project-file") || delegate.publications.includes("git") || delegate.publications.includes("chat")) {
        downloadText(`${slugify(latest.title)}.md`, result.packageMarkdown, "text/markdown")
      }
      if (delegate.publications.includes("pdf")) {
        openPrintablePdf(latest.title, result.packageMarkdown)
      }
      setResultMd(delegate.publications.includes("chat") ? result.packageMarkdown : result.packageMarkdown)
      setResultPaths(result.outputPaths)
      setPrompt({ ...latest, status: "delegated" })
      setStep("done")
      refresh()
    } finally {
      setBusy(false)
    }
  }

  function openFromHistory(item: PromptRecord) {
    setPrompt(item)
    setTitle(item.title)
    setRequest(item.request)
    setBody(item.body)
    setDelegate((current) => ({ ...current, modelTier: item.recommendedTier }))
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
            Составьте структурированный промт, сохраните пакет и передайте задание в Cursor. Данные в браузере, без сервера.
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
        </div>
      </div>

      {error ? <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      {tab === "history" ? (
        <HistoryPanel prompts={history} tasks={tasks} query={query} onQuery={setQuery} onOpen={openFromHistory} />
      ) : (
        <div className="grid gap-4">
          <ComposePanel
            request={request}
            title={title}
            body={body}
            recommendedTier={delegate.modelTier}
            busy={busy}
            onRequest={setRequest}
            onTitle={setTitle}
            onBody={setBody}
            onCompose={onCompose}
          />

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
            <DelegatePanel value={delegate} onChange={setDelegate} onSubmit={onDelegate} busy={busy} />
          ) : null}

          {step === "done" ? (
            <ReportPanel modelId={delegate.modelId} modelTier={delegate.modelTier} paths={resultPaths} markdown={resultMd} />
          ) : null}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">G затем Q — этот раздел. Каталог агентов и моделей — из Cursor, без внешнего API.</p>
    </div>
  )
}
