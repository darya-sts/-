"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { tools, CATEGORIES, KIND_LABEL, STAGE_LABEL } from "@/data/tools"
import type { Tool } from "@/data/types"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { McpBadge, PageHeader } from "@/components/page-header"

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {tool.name}
              {tool.mcp && <McpBadge />}
              {tool.recommended && (
                <Badge variant="secondary">в стеке</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{tool.price}</CardDescription>
          </div>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
            {STAGE_LABEL[tool.stage]}
            {tool.kind ? ` · ${KIND_LABEL[tool.kind]}` : ""}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed">{tool.why}</p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {tool.functions.map((f) => (
            <li key={f}>— {f}</li>
          ))}
        </ul>
        {tool.mcpNote && (
          <p className="rounded-lg bg-mcp/10 px-3 py-2 text-xs leading-relaxed text-mcp">
            {tool.mcpNote}
          </p>
        )}
        <a
          href={tool.url}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs text-primary underline-offset-4 hover:underline"
        >
          Сайт
        </a>
      </CardContent>
    </Card>
  )
}

export default function ToolsPage() {
  const [q, setQ] = useState("")
  const [mcpOnly, setMcpOnly] = useState(false)
  const [recOnly, setRecOnly] = useState(false)
  const [tab, setTab] = useState<string>("generate")

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      if (t.category !== tab) return false
      if (mcpOnly && !t.mcp) return false
      if (recOnly && !t.recommended) return false
      if (q.trim()) {
        const hay = `${t.name} ${t.why} ${t.functions.join(" ")} ${t.mcpNote ?? ""}`.toLowerCase()
        if (!hay.includes(q.toLowerCase())) return false
      }
      return true
    })
  }, [q, mcpOnly, recOnly, tab])

  const generateKinds = ["text", "video", "audio", "image"] as const

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader
        kicker="Каталог"
        title="Инструменты по этапам производства"
        description="Цены — ориентир на август 2026, без учёта налогов и годовых скидок. «В стеке» — то, что реально нужно соло-фабрике. MCP отмечен отдельно: эти сервисы агент Cursor может дергать сам."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Поиск: голос, превью, X, партнёрка…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={mcpOnly} onCheckedChange={(v) => setMcpOnly(Boolean(v))} />
          Только MCP
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={recOnly} onCheckedChange={(v) => setRecOnly(Boolean(v))} />
          Только стек
        </label>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" className="h-auto w-full flex-wrap justify-start">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.id} value={c.id}>
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {CATEGORIES.map((c) => (
          <TabsContent key={c.id} value={c.id} className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">{c.blurb}</p>
            {c.id === "generate" ? (
              generateKinds.map((kind) => {
                const list = filtered.filter((t) => t.kind === kind)
                if (!list.length) return null
                return (
                  <div key={kind} className="space-y-3">
                    <h2 className="font-heading text-lg">{KIND_LABEL[kind]}</h2>
                    <div className="grid gap-3 md:grid-cols-2">
                      {list.map((t) => (
                        <ToolCard key={t.id} tool={t} />
                      ))}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filtered.map((t) => (
                  <ToolCard key={t.id} tool={t} />
                ))}
              </div>
            )}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground">Ничего не найдено. Снимите фильтры.</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </main>
  )
}
