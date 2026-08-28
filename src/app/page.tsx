import Link from "next/link"
import { ArrowRight, CheckCircle2, Cpu, Radio, Wallet } from "lucide-react"
import { DeadlineBanner } from "@/components/deadline-banner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PRIMARY_NICHE } from "@/data/niches"
import { months } from "@/data/plan"
import { GROWTH_SUM, LEAN_SUM, STARTUP_TOTAL } from "@/data/finance"
import { usd } from "@/lib/format"
import { tools } from "@/data/tools"

const mcpCount = tools.filter((t) => t.mcp).length

export default function HomePage() {
  return (
    <main className="mill-grid">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 sm:px-8 sm:py-12">
        <DeadlineBanner />

        <section className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">
              Сетка EN · YouTube · X · Telegram
            </p>
            <h1 className="font-heading mt-3 max-w-2xl text-4xl tracking-tight text-balance sm:text-5xl">
              Фабрика контента, а не кладбище ИИ-роликов
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Плейбук под вашу подписку Cursor: стек с MCP, ниша с проверяемым CPM, план на 6 месяцев
              и модель, где $1 000–2 000 чистыми приходят из партнёрок и продукта, а не из чуда AdSense.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button render={<Link href="/plan" />}>
                Открыть план
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button variant="outline" render={<Link href="/tools" />}>
                Каталог инструментов
              </Button>
            </div>
          </div>
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Стартовый контур</CardTitle>
              <CardDescription>Без второго ChatGPT и без аватар-фермы.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Старт, мес. 1</p>
                <p className="font-heading mt-1 text-2xl">{usd(STARTUP_TOTAL)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lean / месяц</p>
                <p className="font-heading mt-1 text-2xl">{usd(LEAN_SUM)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Growth / месяц</p>
                <p className="font-heading mt-1 text-2xl">{usd(GROWTH_SUM)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Инструментов с MCP</p>
                <p className="font-heading mt-1 text-2xl">{mcpCount}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Cpu className="size-4 text-primary" />
              <CardTitle>Cursor как цех</CardTitle>
              <CardDescription>
                Сценарий, тред, чеклист TG и дисклеймер рождаются в одном чате. MCP подключает Notion,
                ElevenLabs и n8n — без копипаста в пять вкладок.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Radio className="size-4 text-primary" />
              <CardTitle>X больше не про репосты</CardTitle>
              <CardDescription>
                Original Content Rewards с августа 2026 платит за оригинальный тезис. Автопостинг
                транскрипта YouTube в программу не проходит.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Wallet className="size-4 text-primary" />
              <CardTitle>YPP — не зарплата</CardTitle>
              <CardDescription>
                В базовом сценарии к месяцу 6 реклама YouTube ≈ $420, партнёрки + продукт ≈ $1 070,
                X и Telegram ≈ $300. Чистыми ~$1 670 при расходах около $120.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <p className="text-xs tracking-[0.16em] text-primary uppercase">Рекомендованная ниша</p>
              <CardTitle className="text-xl">{PRIMARY_NICHE.name}</CardTitle>
              <CardDescription>{PRIMARY_NICHE.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{PRIMARY_NICHE.whyHighCpm}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-secondary px-2.5 py-1">
                  CPM {usd(PRIMARY_NICHE.cpm[0])}–{usd(PRIMARY_NICHE.cpm[1])}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1">
                  RPM {usd(PRIMARY_NICHE.rpm[0])}–{usd(PRIMARY_NICHE.rpm[1])}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1">Faceless: экран + голос</span>
              </div>
              <Button variant="outline" size="sm" render={<Link href="/niches" />}>
                Сравнить ниши
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Что должно быть правдой к месяцу 6</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {[
                  "Один YouTube, не сетка из 12 однотипных каналов",
                  "2–3 лонга в неделю по 10+ минут, US-заголовки",
                  "Партнёрки заведены в месяце 1, продукт — в 5",
                  "Заявка YPP подана в декабре–январе, не после 1 февраля",
                  "X — ручной approve, Telegram — бот и Stars",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-mcp" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="font-heading text-2xl">Шесть месяцев</h2>
            <Link href="/plan" className="text-sm text-primary underline-offset-4 hover:underline">
              Чеклист по неделям
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {months.map((m) => (
              <Link key={m.month} href="/plan" className="block">
                <Card className="h-full transition-colors hover:bg-secondary/40">
                  <CardHeader>
                    <p className="font-mono text-xs text-primary">0{m.month} · {m.dates}</p>
                    <CardTitle className="text-base">{m.title}</CardTitle>
                    <CardDescription>{m.northStar}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
