"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Download, Plus, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { catalogFromBundle, loadAgentSettings, loadAgentsCatalog, saveAgentSettings } from "@/lib/agents/store"
import { SCAN_SOURCES } from "@/lib/agents/scan"
import type { AgentSettings } from "@/lib/agents/types"
import { IconTip } from "@/components/agents/icon-tip"

export function AgentsSettings() {
  const [settings, setSettings] = useState<AgentSettings | null>(null)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setSettings(loadAgentSettings())
  }, [])

  function persist(next: AgentSettings) {
    saveAgentSettings(next)
    setSettings(next)
  }

  if (!settings) return <p className="text-sm text-muted-foreground">Загрузка настроек…</p>

  return (
    <div className="grid max-w-3xl gap-4">
      <nav className="text-[13px] text-muted-foreground">
        <Link href="/agents/" className="text-primary hover:underline">
          Агенты и Боты
        </Link>
        {" / "}
        <strong className="text-foreground">Настройки</strong>
      </nav>
      <h1 className="text-[28px] leading-tight tracking-tight">Системные настройки</h1>

      <Card>
        <CardContent className="grid gap-3">
          <h2 className="text-sm font-bold">Репозитории</h2>
          <ul className="grid gap-2">
            {settings.repos.map((repo) => (
              <li key={repo.id} className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{repo.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{repo.url}</span>
                </span>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Удалить ${repo.name}`}
                  onClick={() => persist({ ...settings, repos: settings.repos.filter((item) => item.id !== repo.id) })}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input value={name} placeholder="Имя" onChange={(event) => setName(event.target.value)} />
            <Input value={url} placeholder="https://github.com/…" onChange={(event) => setUrl(event.target.value)} />
            <Button
              type="button"
              onClick={() => {
                if (!name.trim() || !url.trim()) return
                persist({
                  ...settings,
                  repos: [...settings.repos, { id: crypto.randomUUID(), name: name.trim(), url: url.trim() }],
                })
                setName("")
                setUrl("")
              }}
            >
              <Plus />
              Добавить
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 text-sm">
          <h2 className="text-sm font-bold">Отображение и обновление</h2>
          <label className="grid max-w-xs gap-1 text-sm">
            <span>Период кэша, минуты</span>
            <Input
              type="number"
              min={1}
              max={60}
              value={settings.refreshMinutes}
              aria-label="Период кэша в минутах"
              onChange={(event) => persist({ ...settings, refreshMinutes: Math.max(1, Number(event.target.value) || 5) })}
            />
          </label>
          <p>Ручное обновление сбрасывает кэш и заново читает <code>/api/agents.json</code>.</p>
          <p className="text-muted-foreground">
            Вебхуки Cursor на статическом хостинге не принимаются. Симулированный endpoint:{" "}
            <code>/api/agents.json</code>. После изменения в репозитории нажмите синхронизацию.
          </p>
          <ul className="rounded-xl bg-white/80 p-3 text-xs text-muted-foreground">
            {SCAN_SOURCES.map((source) => (
              <li key={source.path}>
                <code>{source.path}</code> — {source.note}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <IconTip label="Скачать каталог заново">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await loadAgentsCatalog(true)
                  persist({ ...loadAgentSettings(), lastSync: Date.now() })
                  setNotice("Каталог обновлён.")
                }}
              >
                <RefreshCw />
                Синхронизация с Cursor
              </Button>
            </IconTip>
            <IconTip label="Скачать forgemill-agents.json">
              <Button
                type="button"
                variant="outline"
                data-testid="export-agents"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(catalogFromBundle(), null, 2)], { type: "application/json" })
                  const href = URL.createObjectURL(blob)
                  const link = document.createElement("a")
                  link.href = href
                  link.download = "forgemill-agents.json"
                  link.click()
                  URL.revokeObjectURL(href)
                  setNotice("Экспорт JSON готов.")
                }}
              >
                <Download />
                Экспорт JSON
              </Button>
            </IconTip>
          </div>
          {notice ? <p className="text-mcp">{notice}</p> : null}
          {settings.lastSync ? (
            <p className="text-xs text-muted-foreground">Последняя синхронизация: {new Date(settings.lastSync).toLocaleString("ru-RU")}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
