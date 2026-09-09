"use client"

import { useState } from "react"
import { PageHeader, McpBadge } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CURSOR_RULES, MCP_JSON_EXAMPLE, mcpServers } from "@/data/mcp"

export default function McpPage() {
  const [copied, setCopied] = useState<"json" | "rules" | null>(null)

  async function copy(text: string, key: "json" | "rules") {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1600)
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader
        kicker="Cursor"
        title="MCP — как агент становится цехом, а не чатом"
        description="Подписка Cursor уже закрывает сценарии. MCP закрывает руки: голос, календарь, поиск, отправка в Telegram. X оставляем с человеческим approve — иначе Original Content Rewards вас не видит."
      />

      <Card>
        <CardHeader>
          <CardTitle>Минимальный набор на неделю 2</CardTitle>
          <CardDescription>Notion + ElevenLabs + Brave Search + filesystem. Остальное — по боли.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => copy(MCP_JSON_EXAMPLE, "json")}>
            {copied === "json" ? "Скопировано" : "Копировать mcp.json"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => copy(CURSOR_RULES, "rules")}>
            {copied === "rules" ? "Скопировано" : "Копировать правило канала"}
          </Button>
        </CardContent>
      </Card>

      <pre className="overflow-x-auto rounded-xl border bg-card p-4 font-mono text-xs leading-relaxed">
        {MCP_JSON_EXAMPLE}
      </pre>

      <div className="grid gap-3">
        {mcpServers.map((s) => (
          <Card key={s.name}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                {s.name}
                <McpBadge />
                {s.official ? (
                  <Badge variant="secondary">официальный</Badge>
                ) : (
                  <Badge variant="outline">community</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{s.use}</p>
              <p className="text-muted-foreground">Установка: {s.setup}</p>
              {s.caution && <p className="text-primary">{s.caution}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Правило канала (вставьте в Cursor)</CardTitle>
          <CardDescription>User rule или .cursor/rules/factory.mdc — чтобы тон не плыл от ролика к ролику.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed">{CURSOR_RULES}</pre>
        </CardContent>
      </Card>
    </main>
  )
}
