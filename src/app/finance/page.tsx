"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ASSUMPTIONS,
  GROWTH_ADDS,
  GROWTH_SUM,
  LEAN_MONTHLY,
  LEAN_SUM,
  SCALE_ADDS,
  SCALE_SUM,
  STARTUP,
  STARTUP_TOTAL,
  SCENARIO_LABEL,
  breakEvenMonth,
  series,
  type Scenario,
} from "@/data/finance"
import { usd } from "@/lib/format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function FinancePage() {
  const [scenario, setScenario] = useState<Scenario>("base")
  const [stack, setStack] = useState<"lean" | "growth">("growth")
  const rows = useMemo(() => series(scenario, stack), [scenario, stack])
  const be = breakEvenMonth(scenario, stack)
  const m6 = rows[5]

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader
        kicker="P&L"
        title="Расходы, выручка и точка безубыточности"
        description="Модель под нишу AI-систем для солопренёров и lean/growth стек. Это не гарантия дохода: это арифметика, которую можно провалить, если снимать Shorts ради просмотров или не завести партнёрки в месяце 1."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Стартовые (месяц 1, без микрофона)</CardDescription>
            <CardTitle className="text-3xl">{usd(STARTUP_TOTAL)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {STARTUP.map((s) => (
              <div key={s.name} className="flex justify-between gap-3">
                <span>
                  {s.name}
                  <span className="block text-xs text-muted-foreground">{s.note}</span>
                </span>
                <span className="font-mono">{usd(s.usd)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Операционка / месяц</CardDescription>
            <CardTitle className="text-3xl">{usd(stack === "lean" ? LEAN_SUM : GROWTH_SUM)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {LEAN_MONTHLY.map((s) => (
              <div key={s.name} className="flex justify-between">
                <span>{s.name}</span>
                <span className="font-mono">{usd(s.usd)}</span>
              </div>
            ))}
            {stack === "growth" &&
              GROWTH_ADDS.map((s) => (
                <div key={s.name} className="flex justify-between text-primary">
                  <span>{s.name}</span>
                  <span className="font-mono">{usd(s.usd)}</span>
                </div>
              ))}
            <p className="pt-2 text-xs text-muted-foreground">
              Scale ({usd(SCALE_SUM)}): {SCALE_ADDS.map((s) => s.name).join(", ")} — с месяца 5–6 по желанию.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Месяц 6, этот сценарий</CardDescription>
            <CardTitle className="text-3xl">{usd(m6.net)}</CardTitle>
            <CardDescription>
              Выручка {usd(m6.rev)} − расход {usd(m6.cost)}. Накоплено с учётом старта: {usd(m6.cum)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            Безубыточность по накопленному кэшу:{" "}
            {be ? `месяц ${be}` : "за 6 месяцев не выходим — смотрите агрессивный или режьте стек"}.
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={scenario} onValueChange={(v) => setScenario(v as Scenario)}>
          <TabsList>
            {(Object.keys(SCENARIO_LABEL) as Scenario[]).map((k) => (
              <TabsTrigger key={k} value={k}>
                {SCENARIO_LABEL[k]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs value={stack} onValueChange={(v) => setStack(v as "lean" | "growth")}>
          <TabsList>
            <TabsTrigger value="lean">Стек lean {usd(LEAN_SUM)}</TabsTrigger>
            <TabsTrigger value="growth">Стек growth {usd(GROWTH_SUM)}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Мес</TableHead>
              <TableHead>Сабы / часы</TableHead>
              <TableHead className="text-right">Ads</TableHead>
              <TableHead className="text-right">Партнёрки</TableHead>
              <TableHead className="text-right">Продукт</TableHead>
              <TableHead className="text-right">X</TableHead>
              <TableHead className="text-right">TG</TableHead>
              <TableHead className="text-right">Выручка</TableHead>
              <TableHead className="text-right">Расход</TableHead>
              <TableHead className="text-right">Нетто</TableHead>
              <TableHead className="text-right">Накоплено</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => {
              const r = m.revenue[scenario]
              return (
                <TableRow key={m.month}>
                  <TableCell className="font-medium">
                    {m.month}
                    <span className="block text-xs font-normal text-muted-foreground">{m.label}</span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {m.subs[scenario]} саб.
                    <br />
                    {m.hours[scenario]} ч
                  </TableCell>
                  <TableCell className="text-right font-mono">{usd(r.ads)}</TableCell>
                  <TableCell className="text-right font-mono">{usd(r.affiliate)}</TableCell>
                  <TableCell className="text-right font-mono">{usd(r.product)}</TableCell>
                  <TableCell className="text-right font-mono">{usd(r.x)}</TableCell>
                  <TableCell className="text-right font-mono">{usd(r.tg)}</TableCell>
                  <TableCell className="text-right font-mono">{usd(m.rev)}</TableCell>
                  <TableCell className="text-right font-mono">{usd(m.cost)}</TableCell>
                  <TableCell className="text-right font-mono">{usd(m.net)}</TableCell>
                  <TableCell className="text-right font-mono">{usd(m.cum)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Откуда берётся $1–2k</CardTitle>
          <CardDescription>
            В базовом сценарии месяц 6: ads {usd(rows[5].revenue.base.ads)} + партнёрки{" "}
            {usd(rows[5].revenue.base.affiliate)} + продукт {usd(rows[5].revenue.base.product)} + X{" "}
            {usd(rows[5].revenue.base.x)} + TG {usd(rows[5].revenue.base.tg)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm leading-relaxed">
            {ASSUMPTIONS.map((a) => (
              <li key={a}>— {a}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
