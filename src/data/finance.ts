export type Scenario = "conservative" | "base" | "aggressive"

export const SCENARIO_LABEL: Record<Scenario, string> = {
  conservative: "Консервативный",
  base: "Базовый",
  aggressive: "Агрессивный",
}

export type MonthFinance = {
  month: number
  label: string
  costLean: number
  costGrowth: number
  revenue: Record<Scenario, { ads: number; affiliate: number; product: number; x: number; tg: number }>
  hours: Record<Scenario, number>
  subs: Record<Scenario, number>
}

export const STARTUP = [
  { name: "Домен .com + почта на 1 год", usd: 20, note: "Не Gmail канала." },
  { name: "Canva Pro, первый месяц", usd: 15, note: "Или $120/год сразу." },
  { name: "ElevenLabs Creator", usd: 22, note: "Голос фабрики." },
  { name: "X Premium (web)", usd: 8, note: "Не через App Store." },
  { name: "Typefully Starter", usd: 8, note: "Очередь X." },
  { name: "Cursor Pro", usd: 0, note: "Уже есть — в расход не кладём." },
  { name: "Микрофон (опционально)", usd: 0, note: "Если свой голос: $50–80 разово. Faceless TTS — $0." },
]

export const STARTUP_TOTAL = STARTUP.reduce((s, x) => s + x.usd, 0)

export const LEAN_MONTHLY = [
  { name: "ElevenLabs Creator", usd: 22 },
  { name: "Canva Pro", usd: 15 },
  { name: "X Premium", usd: 8 },
  { name: "Typefully Starter", usd: 8 },
  { name: "Cursor", usd: 0 },
]

export const GROWTH_ADDS = [
  { name: "vidIQ Boost", usd: 10 },
  { name: "Opus Clip Starter", usd: 15 },
  { name: "Epidemic Sound", usd: 15 },
]

export const SCALE_ADDS = [
  { name: "HeyGen или Blotato (не оба)", usd: 29 },
  { name: "n8n Cloud (если не self-host)", usd: 24 },
]

export const LEAN_SUM = LEAN_MONTHLY.reduce((s, x) => s + x.usd, 0)
export const GROWTH_SUM = LEAN_SUM + GROWTH_ADDS.reduce((s, x) => s + x.usd, 0)
export const SCALE_SUM = GROWTH_SUM + 29

export const monthsFinance: MonthFinance[] = [
  {
    month: 1,
    label: "Склад, без трафика",
    costLean: LEAN_SUM,
    costGrowth: LEAN_SUM,
    revenue: {
      conservative: { ads: 0, affiliate: 0, product: 0, x: 0, tg: 0 },
      base: { ads: 0, affiliate: 0, product: 0, x: 0, tg: 0 },
      aggressive: { ads: 0, affiliate: 20, product: 0, x: 0, tg: 0 },
    },
    hours: { conservative: 40, base: 80, aggressive: 120 },
    subs: { conservative: 40, base: 80, aggressive: 150 },
  },
  {
    month: 2,
    label: "Запуск ритма",
    costLean: LEAN_SUM,
    costGrowth: GROWTH_SUM,
    revenue: {
      conservative: { ads: 0, affiliate: 20, product: 0, x: 0, tg: 0 },
      base: { ads: 0, affiliate: 50, product: 0, x: 0, tg: 10 },
      aggressive: { ads: 0, affiliate: 120, product: 0, x: 0, tg: 30 },
    },
    hours: { conservative: 180, base: 400, aggressive: 700 },
    subs: { conservative: 120, base: 280, aggressive: 500 },
  },
  {
    month: 3,
    label: "Оптимизация",
    costLean: GROWTH_SUM,
    costGrowth: GROWTH_SUM,
    revenue: {
      conservative: { ads: 0, affiliate: 80, product: 0, x: 0, tg: 20 },
      base: { ads: 0, affiliate: 160, product: 40, x: 0, tg: 40 },
      aggressive: { ads: 0, affiliate: 320, product: 120, x: 20, tg: 80 },
    },
    hours: { conservative: 600, base: 1400, aggressive: 2200 },
    subs: { conservative: 280, base: 620, aggressive: 950 },
  },
  {
    month: 4,
    label: "Штурм YPP / Q4 CPM",
    costLean: GROWTH_SUM,
    costGrowth: GROWTH_SUM,
    revenue: {
      conservative: { ads: 0, affiliate: 150, product: 40, x: 0, tg: 40 },
      base: { ads: 80, affiliate: 280, product: 120, x: 20, tg: 60 },
      aggressive: { ads: 250, affiliate: 500, product: 280, x: 60, tg: 120 },
    },
    hours: { conservative: 1500, base: 3200, aggressive: 4800 },
    subs: { conservative: 520, base: 1050, aggressive: 1600 },
  },
  {
    month: 5,
    label: "Все краны",
    costLean: GROWTH_SUM,
    costGrowth: SCALE_SUM,
    revenue: {
      conservative: { ads: 120, affiliate: 220, product: 120, x: 20, tg: 60 },
      base: { ads: 280, affiliate: 420, product: 350, x: 80, tg: 120 },
      aggressive: { ads: 600, affiliate: 700, product: 650, x: 180, tg: 250 },
    },
    hours: { conservative: 2400, base: 5000, aggressive: 7200 },
    subs: { conservative: 800, base: 1700, aggressive: 2800 },
  },
  {
    month: 6,
    label: "Цель $1–2k чистыми",
    costLean: GROWTH_SUM,
    costGrowth: SCALE_SUM,
    revenue: {
      conservative: { ads: 200, affiliate: 300, product: 180, x: 40, tg: 80 },
      base: { ads: 420, affiliate: 550, product: 520, x: 120, tg: 180 },
      aggressive: { ads: 800, affiliate: 900, product: 900, x: 280, tg: 350 },
    },
    hours: { conservative: 3200, base: 6500, aggressive: 9500 },
    subs: { conservative: 1100, base: 2500, aggressive: 4000 },
  },
]

export function sumRev(
  r: MonthFinance["revenue"][Scenario]
) {
  return r.ads + r.affiliate + r.product + r.x + r.tg
}

export function series(scenario: Scenario, costMode: "lean" | "growth") {
  let cum = -STARTUP_TOTAL
  return monthsFinance.map((m) => {
    const cost = costMode === "lean" ? m.costLean : m.costGrowth
    const rev = sumRev(m.revenue[scenario])
    const net = rev - cost
    cum += net
    return { ...m, cost, rev, net, cum }
  })
}

export function breakEvenMonth(scenario: Scenario, costMode: "lean" | "growth") {
  const s = series(scenario, costMode)
  const hit = s.find((x) => x.cum >= 0)
  return hit ? hit.month : null
}

export const ASSUMPTIONS = [
  "Ниша — AI-системы для солопренёров, аудитория EN, цель geo Tier-1 ≥ 45%.",
  "RPM long-form после YPP: консервативно $5, база $8, агрессивно $12 (не CPM).",
  "Shorts почти не входят в выручку ads до 10 млн views / 90 дней (с фев 2027 это жёсткий порог даже внутри YPP).",
  "Партнёрки дают больше ads до и сразу после YPP — в базе месяцы 5–6 это главный кэш.",
  "Продукт $29–49, конверсия с email/TG 2–4%, не с холодного YouTube.",
  "X Rewards нестабилен и исключает автопостинг. В базе $80–120, не оклад.",
  "Telegram Stars ≈ $0.013, ads 50% с 1 000 саб. VIP дешёвый, чтобы не убить рост паблика.",
  "Cursor уже оплачен. Если считать его $20 — сдвиньте безубыточность на ~1 месяц.",
]
