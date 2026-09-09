import Link from "next/link"
import { ArrowRight, Cpu, Radio, Wallet } from "lucide-react"
import { DeadlineBanner } from "@/components/deadline-banner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GROWTH_SUM, LEAN_SUM, STARTUP_TOTAL, monthsFinance, sumRev } from "@/data/finance"
import { usd } from "@/lib/format"
import { tools } from "@/data/tools"

const mcpCount = tools.filter((t) => t.mcp).length
const m6 = monthsFinance[5]
const m6rev = sumRev(m6.revenue.base)
const m6net = m6rev - m6.costGrowth
const bars = monthsFinance.map((m) => ({
  label: `М${m.month}`,
  lean: m.costLean,
  growth: m.costGrowth,
}))
const maxBar = Math.max(...bars.map((b) => b.growth))

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[28px] leading-tight tracking-tight">Обзор фабрики</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
            KPI, каналы и касса на одной доске — кабинет по палитре Битрикс24.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href="/tools" />}>
            Каталог
          </Button>
          <Button render={<Link href="/plan" />}>
            План на 6 месяцев
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>

      <DeadlineBanner />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="flex-row items-center gap-3 px-4 py-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#d7ebf7] text-primary">
            <Cpu className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">MCP в стеке</p>
            <p className="text-[26px] leading-none font-bold">{mcpCount}</p>
            <p className="text-xs font-semibold text-mcp">+2 за квартал</p>
          </div>
          <svg className="ml-auto h-7 w-[72px] shrink-0" viewBox="0 0 72 28" aria-hidden="true">
            <polyline fill="none" stroke="#0b66c3" strokeWidth="2" points="0,22 12,18 24,20 36,10 48,12 60,6 72,8" />
          </svg>
        </Card>
        <Card className="flex-row items-center gap-3 px-4 py-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#d8f4fb] text-cyan">
            <Wallet className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Чистыми / цель</p>
            <p className="text-[26px] leading-none font-bold">{usd(m6net)}</p>
            <p className="text-xs font-semibold text-mcp">базовый, месяц 6</p>
          </div>
          <svg className="ml-auto h-7 w-[72px] shrink-0" viewBox="0 0 72 28" aria-hidden="true">
            <polyline fill="none" stroke="#1cb5e0" strokeWidth="2" points="0,16 12,14 24,18 36,12 48,13 60,8 72,9" />
          </svg>
        </Card>
        <Card className="flex-row items-center gap-3 px-4 py-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e2f3e3] text-mcp">
            <Radio className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Касса / месяц</p>
            <p className="text-[26px] leading-none font-bold">{usd(GROWTH_SUM)}</p>
            <p className="text-xs text-muted-foreground">Growth-контур · lean {usd(LEAN_SUM)}</p>
          </div>
          <svg className="ml-auto h-7 w-[72px] shrink-0" viewBox="0 0 72 28" aria-hidden="true">
            <polyline fill="none" stroke="#4b9b4f" strokeWidth="2" points="0,20 12,19 24,16 36,17 48,11 60,10 72,7" />
          </svg>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.45fr_0.85fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Выручка по месяцам</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              <span className="mr-2 inline-block size-2 rounded-sm bg-[#c5d7e6]" />
              Lean
              <span className="mr-2 ml-3 inline-block size-2 rounded-sm bg-primary" />
              Growth
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex h-44 items-end gap-2.5 pt-2">
              {bars.map((b) => (
                <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div className="flex h-full items-end justify-center gap-1">
                    <span
                      className="w-2.5 rounded-t-md bg-[#c5d7e6]"
                      style={{ height: `${Math.round((b.lean / maxBar) * 100)}%` }}
                    />
                    <span
                      className="w-2.5 rounded-t-md bg-primary"
                      style={{ height: `${Math.round((b.growth / maxBar) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{b.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Каналы</CardTitle>
            <span className="rounded-lg border border-border bg-white px-2 py-0.5 text-[11px] text-muted-foreground">
              план сетки
            </span>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative grid size-32 place-items-center">
              <div
                className="size-32 rounded-full"
                style={{
                  background:
                    "conic-gradient(#0b66c3 0 52%, #1cb5e0 52% 78%, #cfe6f4 78% 100%)",
                  mask: "radial-gradient(transparent 58%, #000 59%)",
                  WebkitMask: "radial-gradient(transparent 58%, #000 59%)",
                }}
              />
              <span className="absolute text-[22px] font-bold">52%</span>
            </div>
            <ul className="w-full text-xs">
              <li className="flex justify-between border-t border-primary/10 py-1.5">
                <span>YouTube EN</span>
                <b>52%</b>
              </li>
              <li className="flex justify-between border-t border-primary/10 py-1.5">
                <span>X Original</span>
                <b>26%</b>
              </li>
              <li className="flex justify-between border-t border-primary/10 py-1.5">
                <span>Telegram</span>
                <b>22%</b>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="overflow-hidden text-center">
          <div className="h-[72px] bg-primary" />
          <div className="-mt-7 mx-auto grid size-16 place-items-center rounded-full border-[3px] border-card bg-primary text-lg font-bold text-white">
            NS
          </div>
          <CardHeader>
            <CardTitle>neurosolutions</CardTitle>
            <CardDescription>admin · сессия фабрики</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 pb-4">
            <div className="rounded-[10px] bg-white/55 py-2">
              <p className="text-[11px] text-muted-foreground">MCP</p>
              <p className="font-bold">{mcpCount}</p>
            </div>
            <div className="rounded-[10px] bg-white/55 py-2">
              <p className="text-[11px] text-muted-foreground">Каналы</p>
              <p className="font-bold">3</p>
            </div>
            <div className="rounded-[10px] bg-white/55 py-2">
              <p className="text-[11px] text-muted-foreground">Growth</p>
              <p className="font-bold">{usd(GROWTH_SUM)}</p>
            </div>
            <Button variant="outline" className="col-span-3" render={<Link href="/vault" />}>
              База паролей
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.45fr_0.85fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Лучшие площадки</CardTitle>
            <span className="rounded-lg border border-border bg-white px-2 py-0.5 text-[11px] text-muted-foreground">
              6 мес.
            </span>
          </CardHeader>
          <CardContent>
            <ul className="text-sm">
              {[
                { id: "YT", name: "YouTube EN", width: "82%", delta: "+12%", color: "bg-mcp" },
                { id: "X", name: "X Original Rewards", width: "54%", delta: "+6%", color: "bg-[#f0a202]" },
                { id: "TG", name: "Telegram", width: "28%", delta: "месяц 1", color: "bg-[#e07a5f]" },
              ].map((row) => (
                <li key={row.id} className="grid grid-cols-[36px_1fr_auto] items-center gap-2.5 border-t border-primary/10 py-2.5">
                  <span className="grid size-8 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
                    {row.id}
                  </span>
                  <div>
                    <p className="font-semibold">{row.name}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#d7e6ef]">
                      <i className={`block h-full rounded-full ${row.color}`} style={{ width: row.width }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-mcp">{row.delta}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>YPP до февраля</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative h-[100px] w-[180px] overflow-hidden">
              <div
                className="size-[180px] rounded-full"
                style={{
                  background: "conic-gradient(from 180deg, #0b66c3 0 135deg, #d5e4ee 135deg 180deg)",
                  mask: "radial-gradient(transparent 58%, #000 59%)",
                  WebkitMask: "radial-gradient(transparent 58%, #000 59%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-1 text-center">
                <p className="text-[28px] leading-none font-bold">62%</p>
                <p className="text-xs text-muted-foreground">ниша + стек</p>
              </div>
            </div>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Заявка ещё не подана. Старт {usd(STARTUP_TOTAL)}.
            </p>
          </CardContent>
        </Card>

        <Card className="flex min-h-[180px] flex-col">
          <CardHeader>
            <p className="text-xs text-muted-foreground">Стартовый контур</p>
            <p className="text-[32px] leading-none font-bold">{usd(STARTUP_TOTAL)}</p>
            <CardDescription>Месяц 1: домен, Cursor, MCP. Lean дальше — {usd(LEAN_SUM)}.</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button className="w-full" render={<Link href="/finance" />}>
              Открыть кассу
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
