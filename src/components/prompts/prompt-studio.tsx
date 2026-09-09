"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, History, Sparkles, Send } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  promptsApi,
  type PromptCatalog,
  type PromptRecord,
  type PromptTaskRecord,
} from "@/lib/prompts-api"
import { cn } from "@/lib/utils"

type Step = "compose" | "delegate" | "done"

const TIER_LABEL: Record<string, string> = {
  economy: "Экономичные",
  balanced: "Сбалансированные",
  fast: "Быстрые",
}

export function PromptStudio() {
  const [tab, setTab] = useState<"create" | "history">("create")
  const [catalog, setCatalog] = useState<PromptCatalog | null>(null)
  const [history, setHistory] = useState<PromptRecord[]>([])
  const [tasks, setTasks] = useState<PromptTaskRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [request, setRequest] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [promptId, setPromptId] = useState<string | null>(null)
  const [recommendedTier, setRecommendedTier] = useState<string>("balanced")
  const [step, setStep] = useState<Step>("compose")

  // Delegation checklist
  const [agents, setAgents] = useState<string[]>(["coding", "explore"])
  const [roles, setRoles] = useState<Record<string, string>>({})
  const [modelTier, setModelTier] = useState<"economy" | "balanced" | "fast">("balanced")
  const [modelId, setModelId] = useState("composer-2.5")
  const [publications, setPublications] = useState<string[]>(["project-file", "git", "chat"])
  const [saveToMemory, setSaveToMemory] = useState(true)
  const [memoryItems, setMemoryItems] = useState<string[]>(["prompt-body", "key-decisions"])
  const [priority, setPriority] = useState<"urgent" | "standard" | "background">("standard")
  const [deadline, setDeadline] = useState("")
  const [inputRef, setInputRef] = useState("")
  const [pdfName, setPdfName] = useState("")
  const [resultMd, setResultMd] = useState("")
  const [resultPaths, setResultPaths] = useState<string[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const [c, list, t] = await Promise.all([
          promptsApi.catalog(),
          promptsApi.list(),
          promptsApi.tasks(),
        ])
        setCatalog(c)
        setHistory(list)
        setTasks(t)
        // default roles
        const r: Record<string, string> = {}
        for (const a of c.agents) r[a.id] = a.defaultRole
        setRoles(r)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    })()
  }, [])

  const modelsForTier = useMemo(
    () => (catalog?.models || []).filter((m) => m.tier === modelTier),
    [catalog, modelTier],
  )

  useEffect(() => {
    if (modelsForTier.length && !modelsForTier.some((m) => m.id === modelId)) {
      setModelId(modelsForTier[0].id)
    }
  }, [modelsForTier, modelId])

  const toggle = (list: string[], id: string, setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  const onCompose = async () => {
    setError(null)
    setBusy(true)
    try {
      const composed = await promptsApi.compose(request, title || undefined)
      setTitle(composed.title)
      setBody(composed.body)
      setRecommendedTier(composed.recommendedTier)
      setModelTier(composed.recommendedTier as "economy" | "balanced" | "fast")
      const saved = await promptsApi.create({
        title: composed.title,
        request,
        body: composed.body,
      })
      setPromptId(saved.id)
      setPdfName(`${composed.title.slice(0, 40)}.pdf`)
      setHistory(await promptsApi.list())
      setStep("compose")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onSavePdf = async () => {
    if (!promptId) return
    setBusy(true)
    setError(null)
    try {
      const blob = await promptsApi.pdf(promptId, pdfName || undefined)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = pdfName.endsWith(".pdf") ? pdfName : `${pdfName || "prompt"}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onDelegate = async () => {
    if (!promptId) return
    if (!agents.length) {
      setError("Выберите хотя бы одного агента")
      return
    }
    if (!publications.length) {
      setError("Выберите способ публикации")
      return
    }
    setBusy(true)
    setError(null)
    try {
      // сохранить правки body
      await promptsApi.update(promptId, { title, body })
      const res = await promptsApi.delegate(promptId, {
        agents,
        agentRoles: JSON.stringify(roles),
        modelTier,
        modelId,
        publications,
        saveToMemory,
        memoryItems: saveToMemory ? memoryItems : [],
        priority,
        deadline: deadline || undefined,
        inputRef: inputRef || undefined,
        pdfFileName: pdfName || undefined,
      })
      setResultMd(res.chatPreview || res.packageMarkdown)
      setResultPaths(res.outputPaths)
      setTasks(await promptsApi.tasks())
      setHistory(await promptsApi.list())
      setStep("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader
        kicker="Prompt Studio"
        title="Промты и делегирование в Cursor"
        description="Создайте структурированный промт, сохраните PDF с метаданными и передайте задание в Cursor с ручным выбором агентов, модели и публикации."
      />

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={tab === "create" ? "default" : "outline"}
          onClick={() => setTab("create")}
        >
          <Sparkles />
          Создать
        </Button>
        <Button
          size="sm"
          variant={tab === "history" ? "default" : "outline"}
          onClick={() => setTab("history")}
        >
          <History />
          История
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {tab === "history" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Промты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Пока пусто</p>
              ) : (
                history.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full rounded-lg border px-3 py-2 text-left hover:bg-accent/30"
                    onClick={() => {
                      setPromptId(p.id)
                      setTitle(p.title)
                      setRequest(p.request)
                      setBody(p.body)
                      setTab("create")
                      setStep("compose")
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{p.title}</span>
                      <Badge variant="outline">{p.status}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.request}</p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Задания Cursor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Пока пусто</p>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="rounded-lg border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{t.prompt?.title || t.promptId}</span>
                      <Badge variant="secondary">{t.modelTier}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.agents.join(", ")} · {new Date(t.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Запрос → промт</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Запрос пользователя</p>
                <textarea
                  className="min-h-28 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder="Опишите задачу…"
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Заголовок (необязательно)</p>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <Button onClick={() => void onCompose()} disabled={busy || request.trim().length < 3}>
                <Sparkles />
                Составить промт
              </Button>
              {body ? (
                <>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      Готовый промт (можно править) · рекомендация тарифа:{" "}
                      <strong>{TIER_LABEL[recommendedTier] || recommendedTier}</strong>
                    </p>
                    <textarea
                      className="min-h-56 w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-56"
                        value={pdfName}
                        onChange={(e) => setPdfName(e.target.value)}
                        placeholder="имя.pdf"
                      />
                      <Button variant="outline" onClick={() => void onSavePdf()} disabled={!promptId || busy}>
                        <Download />
                        Сохранить PDF
                      </Button>
                    </div>
                    <Button
                      variant="secondary"
                      disabled={!promptId}
                      onClick={() => setStep("delegate")}
                    >
                      <Send />
                      Передать в Cursor
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {step !== "compose" && promptId ? (
            <Card>
              <CardHeader>
                <CardTitle>2. Чек-лист делегирования (ручное подтверждение)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h3 className="mb-2 text-sm font-semibold">А) Агенты</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(catalog?.agents || []).map((a) => {
                      const on = agents.includes(a.id)
                      return (
                        <label
                          key={a.id}
                          className={cn(
                            "rounded-lg border p-3 text-sm",
                            on && "border-primary bg-primary/5",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggle(agents, a.id, setAgents)}
                            />
                            <span>
                              <span className="font-medium">{a.name}</span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {a.description}
                              </span>
                            </span>
                          </div>
                          {on ? (
                            <Input
                              className="mt-2"
                              value={roles[a.id] || ""}
                              onChange={(e) => setRoles({ ...roles, [a.id]: e.target.value })}
                              placeholder="Роль в задании"
                            />
                          ) : null}
                        </label>
                      )
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-semibold">Б) Модель</h3>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(["economy", "balanced", "fast"] as const).map((t) => (
                      <Button
                        key={t}
                        size="sm"
                        variant={modelTier === t ? "default" : "outline"}
                        onClick={() => setModelTier(t)}
                      >
                        {TIER_LABEL[t]}
                      </Button>
                    ))}
                  </div>
                  <div className="grid gap-2">
                    {modelsForTier.map((m) => (
                      <label
                        key={m.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm",
                          modelId === m.id && "border-primary bg-primary/5",
                        )}
                      >
                        <input
                          type="radio"
                          name="model"
                          checked={modelId === m.id}
                          onChange={() => setModelId(m.id)}
                        />
                        <span>
                          <span className="font-medium">{m.name}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            скорость: {m.speed} · стоимость: {m.cost} · качество: {m.quality}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {m.recommendedFor}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-semibold">В) Публикация</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(catalog?.publications || []).map((p) => (
                      <label key={p.id} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                        <input
                          type="checkbox"
                          checked={publications.includes(p.id)}
                          onChange={() => toggle(publications, p.id, setPublications)}
                        />
                        <span>
                          <span className="font-medium">{p.label}</span>
                          <span className="block text-xs text-muted-foreground">{p.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-semibold">Г) Память</h3>
                  <label className="mb-2 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={saveToMemory}
                      onChange={(e) => setSaveToMemory(e.target.checked)}
                    />
                    Сохранить в долговременную память
                  </label>
                  {saveToMemory ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(catalog?.memoryItems || []).map((m) => (
                        <label key={m.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={memoryItems.includes(m.id)}
                            onChange={() => toggle(memoryItems, m.id, setMemoryItems)}
                          />
                          {m.label}
                        </label>
                      ))}
                    </div>
                  ) : null}
                </section>

                <section className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Приоритет</p>
                    <select
                      className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as typeof priority)}
                    >
                      <option value="urgent">Срочное</option>
                      <option value="standard">Стандартное</option>
                      <option value="background">Фоновое</option>
                    </select>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Дедлайн</p>
                    <Input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="опционально" />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Входные данные (путь/ссылка)</p>
                    <Input value={inputRef} onChange={(e) => setInputRef(e.target.value)} placeholder="опционально" />
                  </div>
                </section>

                <Button onClick={() => void onDelegate()} disabled={busy}>
                  <Send />
                  Подтвердить и сформировать задание
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {step === "done" ? (
            <Card>
              <CardHeader>
                <CardTitle>3. Отчёт</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Задание сформировано. Режим подтверждения: ручной. Модель:{" "}
                  <code>{modelId}</code> ({TIER_LABEL[modelTier]}).
                </p>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Пути артефактов</p>
                  <ul className="list-inside list-disc font-mono text-xs">
                    {resultPaths.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
                {resultMd ? (
                  <textarea
                    readOnly
                    className="min-h-64 w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs"
                    value={resultMd}
                  />
                ) : null}
                <p className="text-sm">
                  Скопируйте задание в Cursor Agent или откройте файл из{" "}
                  <code>.cursor/tasks/</code>. История сохранена во вкладке «История».
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </main>
  )
}
