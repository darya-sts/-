"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Check, ChevronDown, Copy, ExternalLink, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { IconTip } from "@/components/agents/icon-tip"
import { highlightCode } from "@/lib/agents/highlight"
import { agentById, loadAgentsCatalog, loadOverrides, saveOverrides } from "@/lib/agents/store"
import { MEMORY_LABEL, STATUS_LABEL, type AgentRecord, type AgentSkill } from "@/lib/agents/types"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "overview", label: "Обзор" },
  { id: "code", label: "Код" },
  { id: "skills", label: "Скилы" },
  { id: "rules", label: "Правила" },
  { id: "infra", label: "Инфраструктура" },
] as const

type TabId = (typeof TABS)[number]["id"]

export function AgentDetail({ agentId }: { agentId: string }) {
  const [agent, setAgent] = useState<AgentRecord | null>(null)
  const [missing, setMissing] = useState(false)
  const [tab, setTab] = useState<TabId>("overview")
  const [fileIndex, setFileIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState({ meta: true, status: true })

  useEffect(() => {
    void loadAgentsCatalog().then(({ catalog }) => {
      const found = agentById(catalog, agentId)
      setAgent(found ?? null)
      setMissing(!found)
    })
  }, [agentId])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      const index = Number(event.key) - 1
      if (index >= 0 && index < TABS.length) {
        event.preventDefault()
        setTab(TABS[index].id)
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const current = TABS.findIndex((item) => item.id === tab)
        const delta = event.key === "ArrowRight" ? 1 : -1
        const next = TABS[(current + delta + TABS.length) % TABS.length]
        event.preventDefault()
        setTab(next.id)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [tab])

  const file = agent?.files[fileIndex] ?? agent?.files[0]

  async function copyCode() {
    if (!file) return
    await navigator.clipboard.writeText(file.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  function patchSkill(next: AgentSkill) {
    if (!agent) return
    const skills = agent.skills.map((skill) => (skill.id === next.id ? next : skill))
    const overrides = loadOverrides()
    saveOverrides({ ...overrides, [agent.id]: { ...overrides[agent.id], skills } })
    setAgent({ ...agent, skills })
  }

  if (missing) {
    return (
      <div className="rounded-2xl bg-card p-8 text-sm">
        <p className="font-semibold">Агент не найден</p>
        <p className="mt-2 text-muted-foreground">Вернитесь к каталогу и выберите карточку из списка.</p>
        <Button type="button" variant="outline" className="mt-4" render={<Link href="/agents/" />}>
          К списку агентов
        </Button>
      </div>
    )
  }

  if (!agent) {
    return <p className="text-sm text-muted-foreground">Загрузка карточки…</p>
  }

  return (
    <div className="grid gap-4">
      <nav className="text-[13px] text-muted-foreground">
        <Link href="/agents/" className="text-primary hover:underline">
          Агенты и Боты
        </Link>
        {" / "}
        <strong className="text-foreground">{agent.name}</strong>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-tight tracking-tight">{agent.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{agent.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <IconTip label="Глубокая ссылка cursor://file">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.location.href = `cursor://file/${agent.cursorPath}`
              }}
            >
              <FolderOpen />
              Открыть в Cursor
            </Button>
          </IconTip>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl bg-white/80 p-1" role="tablist" aria-label="Разделы карточки">
        {TABS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={tab === item.id ? "default" : "ghost"}
            role="tab"
            id={`agent-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`agent-panel-${item.id}`}
            data-testid={`agent-tab-${item.id}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <Card className="chat-message-enter" key={tab} id={`agent-panel-${tab}`} role="tabpanel" aria-labelledby={`agent-tab-${tab}`}>
        <CardContent>
          {tab === "overview" ? (
            <div className="grid gap-4">
              <section>
                <h2 className="text-sm font-bold">Назначение</h2>
                <p className="mt-1 text-sm leading-relaxed">{agent.description}</p>
              </section>
              <button type="button" className="flex items-center gap-2 text-sm font-bold" onClick={() => setOpen((s) => ({ ...s, meta: !s.meta }))}>
                Метаданные <ChevronDown className={cn("size-4 transition-transform", open.meta ? "rotate-180" : "")} />
              </button>
              {open.meta ? (
                <dl className="grid gap-2 text-sm sm:grid-cols-3">
                  <div><dt className="text-xs text-muted-foreground">Версия</dt><dd>{agent.version}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Создан</dt><dd>{agent.createdAt}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Изменён</dt><dd>{agent.updatedAt}</dd></div>
                </dl>
              ) : null}
              <button type="button" className="flex items-center gap-2 text-sm font-bold" onClick={() => setOpen((s) => ({ ...s, status: !s.status }))}>
                Компоненты <ChevronDown className={cn("size-4 transition-transform", open.status ? "rotate-180" : "")} />
              </button>
              {open.status ? (
                <ul className="flex flex-wrap gap-2 text-sm">
                  <Badge variant={agent.status === "active" ? "default" : "secondary"}>{STATUS_LABEL[agent.status]}</Badge>
                  <Badge variant={agent.memoryConnected ? "default" : "outline"}>память {agent.memoryConnected ? "on" : "off"}</Badge>
                  <Badge variant="outline">{agent.skills.filter((s) => s.active).length}/{agent.skills.length} скилов</Badge>
                  <Badge variant="outline">{agent.rules.filter((r) => r.active).length}/{agent.rules.length} правил</Badge>
                </ul>
              ) : null}
            </div>
          ) : null}

          {tab === "code" ? (
            <div className="grid gap-3 lg:grid-cols-[14rem_minmax(0,1fr)]">
              <ul className="grid content-start gap-1">
                {agent.tree.map((path) => (
                  <li key={path}>
                    <button
                      type="button"
                      className={cn("w-full rounded-lg px-2 py-1.5 text-left font-mono text-xs", file?.path === path ? "bg-muted" : "hover:bg-muted/70")}
                      onClick={() => {
                        const index = agent.files.findIndex((entry) => entry.path === path)
                        if (index >= 0) setFileIndex(index)
                      }}
                    >
                      {path}
                    </button>
                  </li>
                ))}
              </ul>
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-muted-foreground">{file?.path}</p>
                  <IconTip label="Копировать исходник в буфер">
                    <Button type="button" size="sm" variant="outline" data-testid="copy-code" onClick={() => void copyCode()}>
                      {copied ? <Check /> : <Copy />}
                      {copied ? "Скопировано" : "Копировать"}
                    </Button>
                  </IconTip>
                </div>
                <pre
                  className="max-h-[28rem] overflow-auto rounded-xl bg-white p-3 font-mono text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(file?.content || "Файл есть в дереве, содержимое в каталоге не приложено."),
                  }}
                />
              </div>
            </div>
          ) : null}

          {tab === "skills" ? (
            <SkillList skills={agent.skills} onChange={patchSkill} />
          ) : null}

          {tab === "rules" ? (
            <ul className="grid gap-2">
              {[...agent.rules].sort((a, b) => a.priority - b.priority).map((rule) => (
                <li key={rule.id} className="rounded-xl bg-white/80 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{rule.name}</span>
                    <Badge variant="outline">P{rule.priority}</Badge>
                    <span className={rule.active ? "text-xs font-semibold text-mcp" : "text-xs text-muted-foreground"}>
                      {rule.active ? "активно" : "выкл"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">{rule.text}</p>
                </li>
              ))}
            </ul>
          ) : null}

          {tab === "infra" ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Репозиторий</dt>
                <dd>
                  {agent.infra.repoName} · {agent.infra.branch} · {agent.infra.commit}
                  <a className="ml-2 inline-flex items-center gap-1 text-primary" href={agent.infra.repoUrl} target="_blank" rel="noreferrer">
                    URL <ExternalLink className="size-3" />
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Сервер</dt>
                <dd>
                  {agent.infra.serverPath} · {agent.infra.env} · порты {agent.infra.ports.join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Сервисы</dt>
                <dd>{agent.infra.services.join(", ")}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Память</dt>
                <dd>
                  {MEMORY_LABEL[agent.infra.memoryKind]} · {agent.infra.memoryVolume} · {agent.infra.memoryState}
                </dd>
              </div>
            </dl>
          ) : null}
        </CardContent>
      </Card>
      <p className="text-[11px] text-muted-foreground">Клавиши 1–5 и стрелки влево/вправо переключают вкладки.</p>
    </div>
  )
}

function SkillList({ skills, onChange }: { skills: AgentSkill[]; onChange: (skill: AgentSkill) => void }) {
  const [editing, setEditing] = useState<string | null>(null)
  const current = useMemo(() => skills.find((skill) => skill.id === editing) ?? null, [editing, skills])
  const [description, setDescription] = useState("")
  const [params, setParams] = useState("")

  useEffect(() => {
    if (!current) return
    setDescription(current.description)
    setParams(current.params)
  }, [current])

  return (
    <ul className="grid gap-2">
      {skills.map((skill) => (
        <li key={skill.id} className="rounded-xl bg-white/80 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{skill.name}</p>
              <p className="text-xs text-muted-foreground">{skill.params}</p>
            </div>
            <span className={skill.active ? "text-xs font-semibold text-mcp" : "text-xs text-muted-foreground"}>
              {skill.active ? "активен" : "выкл"}
            </span>
          </div>
          {editing === skill.id ? (
            <div className="mt-2 grid gap-2">
              <Input value={description} onChange={(event) => setDescription(event.target.value)} aria-label="Описание скила" />
              <Input value={params} onChange={(event) => setParams(event.target.value)} aria-label="Параметры скила" />
              <pre className="overflow-auto rounded-lg bg-white p-2 font-mono text-xs">{skill.content}</pre>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onChange({ ...skill, description, params })
                    setEditing(null)
                  }}
                >
                  Сохранить
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditing(null)}>
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm">{skill.description}</p>
              <pre className="mt-2 overflow-auto rounded-lg bg-white p-2 font-mono text-xs">{skill.content}</pre>
              <Button type="button" size="sm" variant="ghost" className="mt-1" onClick={() => setEditing(skill.id)}>
                Править описание
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
