import { PageHeader } from "@/components/page-header"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { platforms } from "@/data/monetization"

export const metadata = { title: "Правила монетизации 2026" }

export default function MonetizationPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader
        kicker="Август 2026"
        title="Правила трёх платформ — как они есть, не как в гайдах 2024"
        description="YouTube ещё пускает в рекламу по 4 000 часам, но 1 февраля 2027 удваивает вход для новых. X сменил ads-share на Original Content Rewards. Telegram платит Stars и 50% ads в публичном канале от 1 000."
      />

      <Accordion multiple defaultValue={["YouTube", "X", "Telegram"]}>
        {platforms.map((p) => (
          <AccordionItem key={p.platform} value={p.platform}>
            <AccordionTrigger className="hover:no-underline">
              <span className="flex flex-col items-start gap-1 pr-4 text-left">
                <span className="font-heading text-lg">{p.platform}</span>
                <span className="text-xs font-normal text-muted-foreground">{p.updated}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-5">
              <p className="leading-relaxed">{p.headline}</p>
              {p.tiers.map((t) => (
                <div key={t.name} className="rounded-lg border px-3 py-3">
                  <p className="font-medium">{t.name}</p>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs tracking-wide text-muted-foreground uppercase">Порог</p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {t.need.map((n) => (
                          <li key={n}>— {n}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs tracking-wide text-muted-foreground uppercase">Что даёт</p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {t.earn.map((n) => (
                          <li key={n}>— {n}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
              <ul className="space-y-2 text-sm text-muted-foreground">
                {p.notes.map((n) => (
                  <li key={n}>— {n}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {p.sources.map((s) => (
                  <a key={s.href} href={s.href} target="_blank" rel="noreferrer">
                    <Badge variant="outline">{s.label}</Badge>
                  </a>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </main>
  )
}
