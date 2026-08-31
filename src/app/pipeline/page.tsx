import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const STEPS = [
  {
    n: "01",
    title: "Тема из календаря",
    body: "Notion MCP: строка со статусом Idea. Агент в Cursor собирает бриф через Brave Search: 3 конкурента, обещание, цифра в хуке, один оффер.",
  },
  {
    n: "02",
    title: "Сценарий 8–12 мин",
    body: "Правило канала: хук 20 с, 3 блока, CTA. Вы правите вслух. Никаких «в этом видео мы поговорим».",
  },
  {
    n: "03",
    title: "Голос",
    body: "ElevenLabs MCP, один voice id. Файл в /factory/audio. Если свой голос — Adobe Podcast Enhance, тот же путь.",
  },
  {
    n: "04",
    title: "Экран и монтаж",
    body: "OBS записывает реальный клик по Cursor/n8n. CapCut: субтитры EN, главы, 10–18 мин. Превью в Canva — цифра или запрет, не стоковое лицо.",
  },
  {
    n: "05",
    title: "YouTube",
    body: "Studio, слот +24–48 ч, 9:00 ET. Описание: главы, дисклеймер, 3 ссылки. Карточки и эндскрин на серию.",
  },
  {
    n: "06",
    title: "Нарезка",
    body: "2 Shorts с разными хуками (CapCut или Opus). Не 12 одинаковых. Shorts ведут в лонг, не живут сами.",
  },
  {
    n: "07",
    title: "X — оригинал",
    body: "Тред: тезис, которого нет в первых 20 секундах ролика. Скрин таблицы. Ручной approve в Typefully. Не RSS из YouTube.",
  },
  {
    n: "08",
    title: "Telegram",
    body: "Чеклист + файл. Бот/n8n может постить сюда сам. VIP — Stars, паблик остаётся открытым ради ads с 1 000.",
  },
  {
    n: "09",
    title: "Пятница 45 мин",
    body: "CTR, 30с, geo, EPC партнёрок, qualified impressions X. C-форматы в стоп-лист. Цифра идёт в Notion.",
  },
]

export const metadata = { title: "Конвейер" }

export default function PipelinePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader
        kicker="SOP"
        title="Один исходник — три платформы без копипаста"
        description="Единица производства — длинный ролик с вашей позицией. Shorts, X и Telegram — производные с разной работой, не дубли. Если шаг 7 автоматизировать «как есть», X Rewards вас вычеркнет."
      />

      <div className="grid gap-3">
        {STEPS.map((s) => (
          <Card key={s.n}>
            <CardHeader>
              <p className="font-mono text-xs text-primary">{s.n}</p>
              <CardTitle>{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">{s.body}</CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
