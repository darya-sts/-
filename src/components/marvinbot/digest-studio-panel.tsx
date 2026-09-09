"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  marvinApi,
  type DashboardStats,
  type Digest,
  type MarvinArticle,
  type TelegramSource,
} from "@/lib/marvin-api"

const CATEGORIES = [
  "Инструменты ИИ",
  "Скилы и правила для Агентов",
  "Монетизация с помощью ИИ",
  "Прочее",
]

export function DigestStudioPanel({
  onArticleCreated,
  onError,
}: {
  onArticleCreated: (article: MarvinArticle) => void
  onError: (msg: string | null) => void
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [digests, setDigests] = useState<Digest[]>([])
  const [current, setCurrent] = useState<Digest | null>(null)
  const [sources, setSources] = useState<TelegramSource[]>([])
  const [busy, setBusy] = useState(false)
  const [username, setUsername] = useState("")
  const [category, setCategory] = useState(CATEGORIES[0])
  const [weight, setWeight] = useState(3)
  const [msg, setMsg] = useState("")

  const refresh = useCallback(async () => {
    const [s, d, src] = await Promise.all([
      marvinApi.dashboard(),
      marvinApi.listDigests(),
      marvinApi.listSources(),
    ])
    setStats(s)
    setDigests(d)
    setSources(src)
  }, [])

  useEffect(() => {
    void refresh().catch((e) => onError(e instanceof Error ? e.message : "Ошибка дайджеста"))
  }, [refresh, onError])

  async function runDigest() {
    setBusy(true)
    onError(null)
    setMsg("")
    try {
      const digest = await marvinApi.generateDigest()
      setCurrent(digest)
      setMsg(`Дайджест: ${digest.items.length} постов`)
      await refresh()
    } catch (e) {
      onError(e instanceof Error ? e.message : "Ошибка генерации дайджеста")
    } finally {
      setBusy(false)
    }
  }

  async function openDigest(id: string) {
    onError(null)
    try {
      setCurrent(await marvinApi.getDigest(id))
    } catch (e) {
      onError(e instanceof Error ? e.message : "Дайджест не найден")
    }
  }

  async function toggleItem(itemId: string) {
    if (!current) return
    const next = current.items.map((i) => (i.id === itemId ? { ...i, selected: !i.selected } : i))
    const ids = next.filter((i) => i.selected).map((i) => i.id)
    const updated = await marvinApi.selectDigestItems(current.id, ids)
    setCurrent(updated)
  }

  async function generateArticle() {
    if (!current) return
    setBusy(true)
    onError(null)
    try {
      const article = await marvinApi.approveDigest(current.id)
      setMsg(`Статья «${article.title}» · ${article.tokenUsed} tok · ${article.content.length} симв.`)
      onArticleCreated(article)
      await openDigest(current.id)
      await refresh()
    } catch (e) {
      onError(e instanceof Error ? e.message : "Ошибка генерации статьи")
    } finally {
      setBusy(false)
    }
  }

  async function addSource() {
    if (!username.trim()) return
    setBusy(true)
    onError(null)
    try {
      await marvinApi.createSource({ username, category, weight })
      setUsername("")
      await refresh()
    } catch (e) {
      onError(e instanceof Error ? e.message : "Не удалось добавить канал")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Статьи / нед</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-2xl">{stats?.articlesWeek ?? "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Источники</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-2xl">{stats?.sourcesActive ?? "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Дайджесты</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-2xl">{stats?.digestsTotal ?? "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Токены / нед</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-2xl">{stats?.tokensWeek ?? "—"}</CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void runDigest()}>
          {busy ? "Собираем…" : "Сгенерировать дайджест (06:00/18:00 UTC+7)"}
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => void refresh()}>
          Обновить
        </Button>
      </div>
      {msg ? <p className="text-sm text-primary">{msg}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">История дайджестов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {digests.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока пусто — запустите сбор.</p>
            ) : (
              digests.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => void openDigest(d.id)}
                >
                  <span>{new Date(d.date).toLocaleString("ru-RU", { timeZone: "Asia/Novosibirsk" })}</span>
                  <Badge variant="outline">
                    {d.status} · {d.items?.length || 0}
                  </Badge>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Выбор постов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!current ? (
              <p className="text-sm text-muted-foreground">Откройте дайджест слева</p>
            ) : (
              <>
                {current.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      item.selected ? "border-primary bg-primary/10" : "border-border"
                    }`}
                    onClick={() => void toggleItem(item.id)}
                  >
                    <div className="font-medium">
                      {item.selected ? "✅" : "⬜"} [{item.order}]{" "}
                      {(item.post.summary || item.post.text).slice(0, 100)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      📌 {item.post.category} | @{item.post.source.username} · score {item.post.score}
                      {item.post.isExpert ? " · 🟣 #expert" : ""}
                    </div>
                  </button>
                ))}
                <Button disabled={busy} onClick={() => void generateArticle()}>
                  🚀 Сгенерировать статью
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Telegram-источники</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
            />
            <select
              className="h-8 rounded-lg border border-border bg-background px-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={1}
              max={5}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="sm:max-w-20"
            />
            <Button disabled={busy || !username.trim()} onClick={() => void addSource()}>
              Добавить
            </Button>
          </div>
          <div className="space-y-2">
            {sources.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div>
                  <strong>@{s.username}</strong>
                  <span className="ml-2 text-muted-foreground">
                    {s.category} · вес {s.weight}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Badge variant={s.isActive ? "default" : "secondary"}>
                    {s.isActive ? "активен" : "выкл"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void marvinApi.updateSource(s.id, { isActive: !s.isActive }).then(refresh)
                    }
                  >
                    Toggle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}