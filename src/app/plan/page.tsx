"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/page-header"
import { months } from "@/data/plan"
import {
  AGENTS,
  ARCHITECTURE,
  BOT_BUILD,
  FACTORY_GOAL,
  FACTORY_MONTHS,
} from "@/data/beginner-factory"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function BeginnerGuide() {
  return (
    <div className="flex flex-col gap-10">
      <p className="max-w-3xl text-base leading-relaxed">{FACTORY_GOAL}</p>

      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-tight">Как устроен завод</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Это не чат с одной нейросетью «сделай мне медиа». Это шесть ролей. Бот — дверь склада, агенты —
          станки, вы — мастер, который нажимает «можно в эфир».
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ARCHITECTURE.map((n) => (
            <Card key={n.id}>
              <CardHeader>
                <CardDescription>{n.role}</CardDescription>
                <CardTitle className="text-base">{n.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">{n.detail}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-tight">Telegram-бот: собрать за неделю, не за квартал</h2>
        <div className="grid gap-3">
          {BOT_BUILD.map((s) => (
            <Card key={s.n}>
              <CardHeader>
                <p className="font-mono text-xs text-primary">{s.n}</p>
                <CardTitle className="text-base">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">{s.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-tight">Какие агенты подключить</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Все пятеро живут в Cursor. Отдельные «нейросети-сотрудники» с своими подписками не нужны: MCP
          дергает поиск, голос и файлы. Имена ниже — skills или отдельные чаты с одним правилом канала.
        </p>
        <div className="grid gap-3">
          {AGENTS.map((a) => (
            <Card key={a.name}>
              <CardHeader>
                <CardTitle className="text-base">{a.name}</CardTitle>
                <CardDescription>{a.job}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm leading-relaxed">
                <p>
                  <span className="text-muted-foreground">Подключить: </span>
                  {a.connect}
                </p>
                <p className="text-muted-foreground">Не поручать: {a.notThis}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-tight">Шесть месяцев по шагам</h2>
        <Accordion multiple defaultValue={["fm-1"]}>
          {FACTORY_MONTHS.map((m) => (
            <AccordionItem key={m.month} value={`fm-${m.month}`}>
              <AccordionTrigger className="items-center hover:no-underline">
                <span className="flex flex-col items-start gap-1 pr-4 text-left">
                  <span className="font-heading text-base">
                    Месяц {m.month}. {m.title}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="leading-relaxed">{m.inPlainWords}</p>
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">Что делать</p>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed">
                    {m.youDoThisWeek.map((item) => (
                      <li key={item}>— {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">Месяц закрыт, когда</p>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed">
                    {m.doneWhen.map((item) => (
                      <li key={item}>— {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">Не делать</p>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {m.skip.map((item) => (
                      <li key={item}>— {item}</li>
                    ))}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  )
}

function KpiChecklist() {
  const [done, setDone] = useLocalStorage<Record<string, boolean>>("forge-plan-done", {})
  const allIds = months.flatMap((m) => m.weeks.flatMap((w) => w.tasks.map((t) => t.id)))
  const completed = allIds.filter((id) => done[id]).length
  const pct = Math.round((completed / allIds.length) * 100)

  function toggle(id: string, value: boolean) {
    setDone((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <div className="flex flex-col gap-8">
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
    </div>
  )
}

export default function PlanPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader
        kicker="План на 6 месяцев"
        title="От первого бота до кассы"
        description="Для человека, который собирает контент-завод впервые: Telegram-бот, архитектура цеха, какие агенты подключить в Cursor, и только потом ритм публикаций и прибыль. Справа в меню тот же раздел. Чеклист KPI — вторая вкладка."
      />

      <Tabs defaultValue="guide">
        <TabsList className="h-auto w-full max-w-md flex-wrap">
          <TabsTrigger value="guide" className="px-3">
            План на 6 месяцев
          </TabsTrigger>
          <TabsTrigger value="checklist" className="px-3">
            Чеклист KPI
          </TabsTrigger>
        </TabsList>
        <TabsContent value="guide" className="mt-6">
          <BeginnerGuide />
        </TabsContent>
        <TabsContent value="checklist" className="mt-6">
          <KpiChecklist />
        </TabsContent>
      </Tabs>
    </main>
  )
}
