"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/page-header"
import { months } from "@/data/plan"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Badge } from "@/components/ui/badge"

export default function PlanPage() {
  const [done, setDone] = useLocalStorage<Record<string, boolean>>("forge-plan-done", {})
  const allIds = months.flatMap((m) => m.weeks.flatMap((w) => w.tasks.map((t) => t.id)))
  const completed = allIds.filter((id) => done[id]).length
  const pct = Math.round((completed / allIds.length) * 100)

  function toggle(id: string, value: boolean) {
    setDone((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader
        kicker="Календарь"
        title="Шесть месяцев до чистыми $1–2k"
        description="Старт 27 августа 2026. Месяц 4 попадает в Q4 — высокий CPM. Заявку YPP нужно успеть до 1 февраля 2027, иначе вход для новых каналов — 8 000 часов. Отмечайте задачи: прогресс пишется в браузер."
      />

      <div className="rounded-xl border bg-card px-4 py-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span>Прогресс чеклиста</span>
          <span className="font-mono">
            {completed}/{allIds.length} · {pct}%
          </span>
        </div>
        <Progress value={pct} />
      </div>

      <Accordion multiple defaultValue={["m-1"]}>
        {months.map((m) => (
          <AccordionItem key={m.month} value={`m-${m.month}`}>
            <AccordionTrigger className="items-center hover:no-underline">
              <span className="flex flex-col items-start gap-1 pr-4 text-left">
                <span className="font-heading text-base">
                  Месяц {m.month}. {m.title}
                </span>
                <span className="text-xs font-normal text-muted-foreground">{m.dates}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-5">
              <p className="leading-relaxed">{m.northStar}</p>
              <div className="flex flex-wrap gap-2">
                {m.kpis.map((k) => (
                  <Badge key={k.label} variant="secondary">
                    {k.label}: {k.target}
                  </Badge>
                ))}
              </div>
              {m.weeks.map((w) => (
                <div key={w.label} className="rounded-lg border px-3 py-3">
                  <p className="font-medium">{w.label}</p>
                  <p className="mb-3 text-xs text-muted-foreground">{w.focus}</p>
                  <ul className="space-y-3">
                    {w.tasks.map((t) => (
                      <li key={t.id} className="flex gap-3">
                        <Checkbox
                          className="mt-1"
                          checked={Boolean(done[t.id])}
                          onCheckedChange={(v) => toggle(t.id, Boolean(v))}
                        />
                        <div>
                          <p className="text-sm font-medium">{t.title}</p>
                          <p className="text-sm leading-relaxed text-muted-foreground">{t.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">На выходе</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {m.output.map((o) => (
                    <li key={o}>— {o}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">Не делать</p>
                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                  {m.watchouts.map((o) => (
                    <li key={o}>— {o}</li>
                  ))}
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </main>
  )
}
