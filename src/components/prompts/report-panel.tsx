"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TEXTAREA_CLASS } from "@/components/tasks/field-styles"
import { TIER_LABEL, type ModelTier } from "@/lib/prompts/types"

export function ReportPanel({
  modelId,
  modelTier,
  paths,
  markdown,
}: {
  modelId: string
  modelTier: ModelTier
  paths: string[]
  markdown: string
}) {
  return (
    <Card className="chat-message-enter">
      <CardContent className="grid gap-3">
        <h2 className="text-sm font-bold">3. Отчёт</h2>
        <p className="text-sm text-muted-foreground">
          Задание сформировано. Режим: ручное подтверждение. Модель: <code>{modelId}</code> ({TIER_LABEL[modelTier]}).
        </p>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Логические пути артефактов</p>
          <ul className="list-inside list-disc font-mono text-xs">
            {paths.map((path) => (
              <li key={path}>{path}</li>
            ))}
          </ul>
        </div>
        {markdown ? (
          <textarea readOnly className={`${TEXTAREA_CLASS} min-h-56 font-mono text-xs`} value={markdown} aria-label="Пакет задания" data-testid="prompt-report" />
        ) : null}
        <p className="text-sm text-muted-foreground">
          Скопируйте задание в Cursor Agent. На статическом хостинге файлы скачиваются в браузер, история — в localStorage.
        </p>
      </CardContent>
    </Card>
  )
}
