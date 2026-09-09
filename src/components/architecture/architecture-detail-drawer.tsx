/** Боковая карточка выбранного объекта. */

"use client"

import { useMemo, useState } from "react"
import { ExternalLink, Settings2, X } from "lucide-react"
import { useArchitectureStore } from "@/architecture/store"
import { TYPE_COLORS, TYPE_LABELS } from "@/architecture/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function ArchitectureDetailDrawer() {
  const selectedId = useArchitectureStore((s) => s.selectedId)
  const graph = useArchitectureStore((s) => s.graph)
  const select = useArchitectureStore((s) => s.select)
  const [rulesOpen, setRulesOpen] = useState(true)

  const obj = useMemo(
    () => graph?.objects.find((o) => o.id === selectedId) || null,
    [graph, selectedId],
  )

  if (!obj) return null

  const color = TYPE_COLORS[obj.type]
  const deps =
    obj.dependencies.map((name) => {
      const linked = graph?.objects.find(
        (o) => o.name.toLowerCase() === name.toLowerCase() || o.id === name,
      )
      return { name, linked }
    }) || []

  return (
    <aside className="flex h-full w-full max-w-md flex-col border-l bg-card/95 shadow-xl backdrop-blur-md">
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg tracking-tight">{obj.name}</h2>
            <Badge
              variant="outline"
              style={{ borderColor: color, color }}
              className="uppercase"
            >
              {TYPE_LABELS[obj.type] || obj.type}
            </Badge>
            {obj.error ? <Badge variant="destructive">ошибка</Badge> : null}
          </div>
          {obj.description ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{obj.description}</p>
          ) : null}
        </div>
        <Button size="icon-sm" variant="ghost" onClick={() => select(null)} aria-label="Закрыть">
          <X />
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {obj.error ? (
          <section className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {obj.error}
          </section>
        ) : null}

        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Скилы
          </h3>
          {obj.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {obj.skills.map((skill) => {
                const src = obj.skillSources?.[skill] || obj.sourcePath
                return (
                  <li key={skill}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm hover:bg-accent/40"
                      title={src}
                      onClick={() => {
                        if (src?.startsWith("http")) window.open(src, "_blank")
                        else if (src) {
                          // Для локальных путей — копируем в буфер как подсказку
                          void navigator.clipboard?.writeText(src)
                        }
                      }}
                    >
                      <span aria-hidden>⚙️</span>
                      <span className="flex-1">{skill}</span>
                      {src ? (
                        <span className="truncate font-mono text-[10px] text-muted-foreground">
                          {src.split("/").slice(-2).join("/")}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section>
          <button
            type="button"
            className="mb-2 flex w-full items-center justify-between text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
            onClick={() => setRulesOpen((v) => !v)}
          >
            Правила
            <span>{rulesOpen ? "▾" : "▸"}</span>
          </button>
          {rulesOpen ? (
            obj.rules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет данных</p>
            ) : (
              <div className="space-y-2 rounded-lg border bg-muted/20 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                {obj.rules.map((r, i) => (
                  <p key={i}>{r}</p>
                ))}
              </div>
            )
          ) : null}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            GitHub
          </h3>
          {obj.github ? (
            <div className="space-y-2 rounded-lg border p-3 text-sm">
              <p className="font-mono text-xs break-all text-muted-foreground">
                {obj.repo || obj.github}
                {obj.branch ? ` @ ${obj.branch}` : ""}
              </p>
              <Button size="sm" render={<a href={obj.github} target="_blank" rel="noreferrer" />}>
                <ExternalLink />
                Открыть репозиторий
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Репозиторий не указан</p>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Сервер
          </h3>
          {obj.server ? (
            <div className="space-y-1.5 rounded-lg border p-3 text-sm">
              <p>
                <span className="text-muted-foreground">Адрес: </span>
                {obj.server.host || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Тип: </span>
                {obj.server.type || "—"}
              </p>
              {obj.server.container ? (
                <p>
                  <span className="text-muted-foreground">Контейнер: </span>
                  {obj.server.container}
                </p>
              ) : null}
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Статус:</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    obj.server.status === "online" && "bg-emerald-500/15 text-emerald-300",
                    obj.server.status === "offline" && "bg-red-500/15 text-red-300",
                    (!obj.server.status || obj.server.status === "unknown") &&
                      "bg-muted text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      obj.server.status === "online" && "bg-emerald-400",
                      obj.server.status === "offline" && "bg-red-400",
                      (!obj.server.status || obj.server.status === "unknown") && "bg-zinc-400",
                    )}
                  />
                  {obj.server.status || "unknown"}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Нет данных о сервере</p>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Связи
          </h3>
          {deps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Зависимости не указаны</p>
          ) : (
            <ul className="space-y-1">
              {deps.map(({ name, linked }) => (
                <li key={name}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm hover:bg-accent/40 disabled:opacity-60"
                    disabled={!linked}
                    onClick={() => linked && select(linked.id)}
                  >
                    <Settings2 className="size-3.5 text-muted-foreground" />
                    {name}
                    {linked ? (
                      <span className="ml-auto text-[10px] text-muted-foreground">открыть</span>
                    ) : (
                      <span className="ml-auto text-[10px] text-muted-foreground">внешний</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {obj.sourcePath ? (
          <p className="font-mono text-[10px] break-all text-muted-foreground">
            Источник: {obj.sourcePath}
          </p>
        ) : null}
      </div>
    </aside>
  )
}
