import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { niches } from "@/data/niches"
import { usd } from "@/lib/format"

export const metadata = { title: "Ниши с высоким CPM" }

export default function NichesPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader
        kicker="Англоязычная аудитория"
        title="Ниши, где CPM можно проверить, а не «почувствовать»"
        description="Цифры CPM/RPM — диапазоны 2026 по открытым разборам (vidIQ, отраслевые сводки), не обещание вашего канала. Гео бьёт нишу: US-зритель даёт в разы больше индийского. Цель фабрики — Tier-1 в заголовке и в примерах, не «для всего мира»."
      />

      <div className="rounded-xl border bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        Как проверить нишу за 3 часа: 10 каналов в Viewstats + расширение vidIQ на выдаче YouTube.
        Живой CPM = в похожих роликах крутится реклама банков/SaaS, а не только VPN. Если в топе только
        миллионники 2019 года и пустые faceless-фермы — пропускайте.
      </div>

      <div className="grid gap-4">
        {niches.map((n) => (
          <Card key={n.id} className={n.recommended ? "ring-1 ring-primary/40" : undefined}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                {n.recommended && <Badge>рекомендуем под Cursor</Badge>}
                <Badge variant="outline">{n.difficulty}</Badge>
                {n.faceless && <Badge variant="secondary">faceless ок</Badge>}
              </div>
              <CardTitle className="text-xl">{n.name}</CardTitle>
              <CardDescription>{n.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-muted-foreground">CPM </span>
                  <span className="font-medium">
                    {usd(n.cpm[0])}–{usd(n.cpm[1])}
                  </span>
                  <span className="text-muted-foreground"> · RPM </span>
                  <span className="font-medium">
                    {usd(n.rpm[0])}–{usd(n.rpm[1])}
                  </span>
                </p>
                <p className="leading-relaxed">{n.whyHighCpm}</p>
                <p className="leading-relaxed">{n.fit}</p>
              </div>
              <div className="space-y-4 text-sm">
                {n.topics.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">Темы</p>
                    <ul className="space-y-1">
                      {n.topics.map((t) => (
                        <li key={t}>— {t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {n.affiliates.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">Партнёрки</p>
                    <ul className="space-y-1">
                      {n.affiliates.map((a) => (
                        <li key={a.name}>
                          <span className="font-medium">{a.name}.</span> {a.typical}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {n.verify.length > 0 && (
                <div className="md:col-span-2 rounded-lg bg-secondary/50 px-4 py-3 text-sm">
                  <p className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">Как проверить</p>
                  <ul className="space-y-1">
                    {n.verify.map((v) => (
                      <li key={v}>— {v}</li>
                    ))}
                  </ul>
                </div>
              )}
              {n.risks.length > 0 && (
                <div className="md:col-span-2 text-sm text-muted-foreground">
                  <p className="mb-1 text-xs tracking-wide uppercase">Риски</p>
                  <ul className="space-y-1">
                    {n.risks.map((v) => (
                      <li key={v}>— {v}</li>
                    ))}
                  </ul>
                </div>
              )}
              {n.firstVideos.length > 0 && (
                <div className="md:col-span-2 text-sm">
                  <p className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">Первые ролики</p>
                  <p>{n.firstVideos.map((v) => `«${v}»`).join(" · ")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Дальше:{" "}
        <Link href="/plan" className="text-primary underline-offset-4 hover:underline">
          месяц 1 — валидация выбранной ниши
        </Link>
        , не съёмка «на всякий случай».
      </p>
    </main>
  )
}
