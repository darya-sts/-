"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { marvinApi, type MarvinArticle, type MarvinSettings } from "@/lib/marvin-api"

type ChatItem = { role: "user" | "assistant"; text: string }

function statusColor(status: string) {
  if (status === "published") return "default"
  if (status === "archived") return "secondary"
  return "outline"
}

export function MarvinBotStudio() {
  const [articles, setArticles] = useState<MarvinArticle[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<MarvinArticle | null>(null)
  const [query, setQuery] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chat, setChat] = useState<ChatItem[]>([])
  const [chatInput, setChatInput] = useState("")
  const [settings, setSettings] = useState<MarvinSettings | null>(null)
  const [skillsText, setSkillsText] = useState("")
  const [rulesText, setRulesText] = useState("")
  const [telegramText, setTelegramText] = useState("")
  const [showNew, setShowNew] = useState(false)

  const load = useCallback(async () => {
    try {
      const [list, skills] = await Promise.all([marvinApi.listArticles(), marvinApi.getSkills()])
      setArticles(list)
      setSettings(skills)
      setSkillsText(skills.skills)
      setRulesText(skills.rules)
      setTelegramText(skills.telegramSources)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!selectedId) {
      setSelected(null)
      return
    }
    void marvinApi
      .getArticle(selectedId)
      .then(setSelected)
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка статьи"))
  }, [selectedId])

  const sorted = useMemo(
    () => [...articles].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [articles],
  )

  async function onGenerate() {
    if (!query.trim()) return
    setBusy(true)
    setError(null)
    setChat((c) => [...c, { role: "user", text: query }])
    try {
      const res = await marvinApi.generate(query)
      setArticles((prev) => [res.article, ...prev])
      setSelectedId(res.article.id)
      setSelected(res.article)
      setShowNew(false)
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: `Статья «${res.article.title}» сохранена${res.cached ? " (cache)" : ""}. Токены: ${res.article.tokenUsed}. Качество: ${res.quality.passed ? "OK" : res.quality.notes.join("; ")}`,
        },
      ])
      setQuery("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка генерации")
    } finally {
      setBusy(false)
    }
  }

  async function onChatSend() {
    if (!selectedId || !chatInput.trim()) return
    setBusy(true)
    setError(null)
    const message = chatInput
    setChatInput("")
    setChat((c) => [...c, { role: "user", text: message }])
    try {
      const res = await marvinApi.chat(selectedId, message)
      setSelected(res.article)
      setArticles((prev) => prev.map((a) => (a.id === res.article.id ? res.article : a)))
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: `Блок обновлён. Качество: ${res.quality.passed ? "OK" : res.quality.notes.join("; ")}`,
        },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка чата")
    } finally {
      setBusy(false)
    }
  }

  async function onSaveSettings() {
    setBusy(true)
    setError(null)
    try {
      const updated = await marvinApi.putSkills({
        skills: skillsText,
        rules: rulesText,
        telegramSources: telegramText,
      })
      setSettings(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения настроек")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader
        kicker="MarvinBot Studio"
        title="Студия статей с MarvinBot"
        description="Генерация HTML-статей, правка блоков через чат, скиллы/правила и экспорт в PDF/Word. Без авторизации, rate limit 10 запросов/мин."
      />

      {error ? (
        <Card className="border-destructive/50">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Статьи</TabsTrigger>
          <TabsTrigger value="chat">Чат</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{sorted.length} статей</p>
            <Button onClick={() => setShowNew((v) => !v)}>Новая статья</Button>
          </div>

          {showNew ? (
            <Card>
              <CardHeader>
                <CardTitle>Запрос для MarvinBot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Напиши статью о лучших практиках CI/CD для ML-проектов"
                />
                <Button disabled={busy || !query.trim()} onClick={() => void onGenerate()}>
                  {busy ? "Генерация…" : "Сгенерировать"}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            {sorted.map((a) => (
              <Card
                key={a.id}
                className={selectedId === a.id ? "ring-1 ring-primary" : "cursor-pointer"}
                onClick={() => setSelectedId(a.id)}
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{a.title}</CardTitle>
                    <Badge variant={statusColor(a.status)}>{a.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString("ru-RU")} · {a.tokenUsed} tok
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1">
                  {a.tags.slice(0, 5).map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {selected ? (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                <CardTitle>{selected.title}</CardTitle>
                <div className="flex gap-2">
                  <a
                    className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-[0.8rem] hover:bg-muted"
                    href={marvinApi.exportUrl(selected.id, "pdf")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF
                  </a>
                  <a
                    className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-[0.8rem] hover:bg-muted"
                    href={marvinApi.exportUrl(selected.id, "docx")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Word
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                <article
                  className="prose prose-invert max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selected.content }}
                />
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="chat" className="mt-6 space-y-4">
          {!selectedId ? (
            <p className="text-sm text-muted-foreground">Сначала выберите или создайте статью.</p>
          ) : (
            <>
              <Card>
                <CardContent className="space-y-3 py-4">
                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {chat.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Напишите, какой блок править: например «Усиль введение цифрами».
                      </p>
                    ) : (
                      chat.map((m, i) => (
                        <div
                          key={`${m.role}-${i}`}
                          className={`rounded-lg px-3 py-2 text-sm ${
                            m.role === "user" ? "bg-primary/15" : "bg-muted"
                          }`}
                        >
                          <span className="mr-2 font-mono text-[10px] uppercase opacity-70">{m.role}</span>
                          {m.text}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Правка блока…"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void onChatSend()
                      }}
                    />
                    <Button disabled={busy || !chatInput.trim()} onClick={() => void onChatSend()}>
                      Отправить
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {selected ? (
                <Card>
                  <CardContent className="py-4">
                    <article
                      className="prose prose-invert max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: selected.content }}
                    />
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills / Rules / Telegram sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-xs tracking-wide text-muted-foreground uppercase">Skills JSON</label>
              <textarea
                className="min-h-32 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
              />
              <label className="block text-xs tracking-wide text-muted-foreground uppercase">Rules JSON</label>
              <textarea
                className="min-h-32 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs"
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
              />
              <label className="block text-xs tracking-wide text-muted-foreground uppercase">
                Telegram sources JSON
              </label>
              <textarea
                className="min-h-24 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs"
                value={telegramText}
                onChange={(e) => setTelegramText(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => void onSaveSettings()}>
                  Сохранить
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(telegramText) as { channels?: string[] }
                      void marvinApi.analyzeTelegram(parsed.channels || [])
                    } catch {
                      setError("telegramSources должен быть валидным JSON")
                    }
                  }}
                >
                  Analyze Telegram
                </Button>
              </div>
              {settings ? (
                <p className="text-xs text-muted-foreground">
                  Обновлено: {new Date(settings.updatedAt).toLocaleString("ru-RU")}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
