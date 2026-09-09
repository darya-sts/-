/** Форма настроек раздела Архитектура. */

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { useArchitectureStore } from "@/architecture/store"
import type { ArchitectureConfig } from "@/architecture/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ArchitectureSettingsForm() {
  const config = useArchitectureStore((s) => s.config)
  const loadSettings = useArchitectureStore((s) => s.loadSettings)
  const saveSettings = useArchitectureStore((s) => s.saveSettings)
  const error = useArchitectureStore((s) => s.error)
  const [draft, setDraft] = useState<ArchitectureConfig>(config)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  useEffect(() => {
    setDraft(config)
  }, [config])

  const onSave = async () => {
    setSaved(false)
    await saveSettings(draft)
    setSaved(true)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" render={<Link href="/architecture/" />}>
          <ArrowLeft />
          К карте
        </Button>
        <Button size="sm" onClick={() => void onSave()}>
          <Save />
          Сохранить
        </Button>
      </div>

      {saved ? (
        <p className="text-sm text-emerald-300">Настройки сохранены.</p>
      ) : null}
      {error ? <p className="text-sm text-amber-300">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Пути сканирования</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            По одному пути на строку (локальные директории относительно корня ForgeMill или абсолютные).
          </p>
          <textarea
            className="min-h-40 w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm"
            value={draft.scanPaths.join("\n")}
            onChange={(e) =>
              setDraft({
                ...draft,
                scanPaths: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GitHub</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.github.enabled}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  github: { ...draft.github, enabled: e.target.checked },
                })
              }
            />
            Включить сканирование через GitHub API
          </label>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Организация / владелец</p>
            <Input
              value={draft.github.org}
              onChange={(e) =>
                setDraft({ ...draft, github: { ...draft.github, org: e.target.value } })
              }
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Репозитории (по одному на строку)</p>
            <textarea
              className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm"
              value={draft.github.repos.join("\n")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  github: {
                    ...draft.github,
                    repos: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Токен берётся из переменной окружения API: <code>GITHUB_TOKEN</code>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Проверка серверов (health)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.serverCheck.enabled}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  serverCheck: { ...draft.serverCheck, enabled: e.target.checked },
                })
              }
            />
            Включить проверку endpoints
          </label>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">
              Формат: ИмяОбъекта = https://host/health (по одному на строку)
            </p>
            <textarea
              className="min-h-32 w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm"
              value={Object.entries(draft.serverCheck.endpoints)
                .map(([k, v]) => `${k} = ${v}`)
                .join("\n")}
              onChange={(e) => {
                const endpoints: Record<string, string> = {}
                for (const line of e.target.value.split("\n")) {
                  const m = line.match(/^([^=]+)=(.*)$/)
                  if (!m) continue
                  endpoints[m[1].trim()] = m[2].trim()
                }
                setDraft({
                  ...draft,
                  serverCheck: { ...draft.serverCheck, endpoints },
                })
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
