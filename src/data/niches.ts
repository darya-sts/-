import type { Niche } from "./types"

export const niches: Niche[] = [
  {
    id: "ai-solopreneur",
    name: "AI-системы для солопренёров США",
    tagline: "Лучший старт под Cursor: вы уже внутри продукта, который рекламируете.",
    recommended: true,
    cpm: [10, 25],
    rpm: [5, 12],
    difficulty: "средняя",
    faceless: true,
    whyHighCpm:
      "Рекламодатели — SaaS с LTV $300–3000/год (Cursor, Notion, ClickUp, Make, CRM). Англоязычный founder в US/UK — дорогой клик.",
    topics: [
      "Сборка недельного контент-конвейера в Cursor + n8n",
      "Замена ассистента: 7 агентных workflow",
      "Сравнение Cursor vs Claude Code vs Copilot для не-инженера",
      "Как считать ROI AI-подписок (таблица)",
    ],
    affiliates: [
      { name: "Cursor, Notion, Make, n8n Cloud", typical: "rev-share 20–40% или $50–200 CPA" },
      { name: "Hostinger / Railway / DigitalOcean", typical: "$50–100 за VPS" },
      { name: "ElevenLabs, Descript", typical: "20–30% recurring" },
    ],
    verify: [
      "YouTube: «cursor n8n workflow», «ai agent for solopreneur» — RPM смотрите у каналов 10–100k через vidIQ/Viewstats.",
      "Ahrefs/Ads: реклама Notion, ClickUp, HubSpot на этих запросах = живой CPM.",
      "Конкуренты: The AI Advantage, Matt Wolfe, Superintelligence, нишевые faceless «AI tools» — ищите пробел «системы, не обзоры».",
      "X: посты про агентов с 50k+ impressions у основателей SaaS подтверждают спрос Premium-аудитории.",
    ],
    risks: [
      "На X автопостинг AI-дайджестов не проходит Original Content Rewards — нужна позиция, кейс, цифры.",
      "Обзоры «50 AI tools» выгорают за квартал. Держите угол: системы под одну роль (consultant / writer / agency).",
      "YouTube может крутить limited ads на «get rich with AI».",
    ],
    fit: "Максимальный fit: экран + голос ElevenLabs, оригинальный комментарий с Cursor, Telegram-пак промптов как продукт.",
    firstVideos: [
      "I replaced my VA with Cursor + n8n (full map)",
      "The $73/mo AI stack that publishes 5 videos/week",
      "Stop using ChatGPT like Google: 4 agent patterns",
    ],
  },
  {
    id: "us-credit-cards",
    name: "US credit cards, HYSA и cash management",
    tagline: "Самый высокий RPM. Жёсткие правила FTC/YouTube и нужна юридическая аккуратность.",
    recommended: false,
    cpm: [20, 50],
    rpm: [10, 25],
    difficulty: "высокая",
    faceless: true,
    whyHighCpm:
      "Эмитенты карт платят $200–500 за одобренную заявку. Банки и fintech бьются за вкладчика HYSA. US-only трафик.",
    topics: [
      "Best starter card if you have no US credit (осторожно с eligibility)",
      "HYSA vs T-bills vs money market — цифры этого месяца",
      "Как не сжечь 5/24",
      "Business card для LLC / sole prop",
    ],
    affiliates: [
      { name: "Bankrate, NerdWallet, Credit Karma, CardRatings (CJ/Impact)", typical: "$50–400 за заявку" },
      { name: "Brokerages (Public, SoFi, Fidelity if available)", typical: "$50–150 funded account" },
    ],
    verify: [
      "Откройте 5 роликов «best 2% cash back 2026» у каналов The Points Guy, Ali Abdaal finance, и faceless «Money Guy shorts» — смотрите advertiser CPM в vidIQ.",
      "Проверьте, что оффер карты жив в US (страницы банков часто geo-gate).",
      "RPM $15+ на mid-roll 8+ мин — норма для US >60% аудитории.",
    ],
    risks: [
      "Жёлтые флаги YT: гарантии дохода, «хаки кредита», вводящие бонусы.",
      "FTC: раскрытие рекламы (#ad, paid partnership) в кадре и описании.",
      "Без US-налогового резидентства часть офферов недоступна — честно пишите «US residents».",
      "Цифры устаревают за недели: закладывайте 30 мин фактчека на ролик.",
    ],
    fit: "Берите, если готовы к таблице ставок и юристу на дисклеймеры. Иначе AI-ниша безопаснее.",
    firstVideos: [
      "The only 3 cards a US beginner needs in 2026",
      "HYSA vs brokerage cash sweep: I ran the math",
      "What 5/24 actually blocks (visual)",
    ],
  },
  {
    id: "b2b-saas",
    name: "B2B SaaS и no-code для малого бизнеса",
    tagline: "Высокий CPA партнёрок. Конкуренция обзоров высокая — выигрывает сравнение «для роли».",
    recommended: false,
    cpm: [15, 40],
    rpm: [7, 18],
    difficulty: "средняя",
    faceless: true,
    whyHighCpm:
      "CRM, email, billing, helpdesk. Один клиент = $1k–20k ARR, поэтому реклама дорогая даже на маленьких каналах.",
    topics: [
      "HubSpot vs Attio vs Notion CRM для 3-person shop",
      "Стек инвойсов: Stripe vs Lemon vs Wave",
      "Как собрать клиентский портал без разработчика",
    ],
    affiliates: [
      { name: "HubSpot, ClickUp, Monday, Notion", typical: "$50–500 CPA / 20–30% rec" },
      { name: "PartnerStack каталог", typical: "20–40% rec 12 мес" },
    ],
    verify: [
      "Ищите «best CRM for consultants 2026» — если в выдаче Ads от HubSpot, CPM живой.",
      "Проверьте PartnerStack: открытые программы с cookie 60–90 дней.",
    ],
    risks: [
      "Обзоры без скринкаста не ранжируются.",
      "Смена тарифов SaaS = постоянный ресёрч.",
    ],
    fit: "Хорошо стыкуется с AI-нишей как вторая «полка» той же сетки.",
    firstVideos: [
      "I ran 5 CRMs for 14 days as a solo consultant",
      "The $0 billing stack (until $10k MRR)",
    ],
  },
  {
    id: "index-investing",
    name: "Index investing и retirement (US)",
    tagline: "Стабильный CPM, длинный хвост SEO, медленный рост. Мало «вирусности».",
    recommended: false,
    cpm: [15, 40],
    rpm: [8, 18],
    difficulty: "высокая",
    faceless: true,
    whyHighCpm: "Брокеры, robo-advisors, страховые. Зритель 30–55 с капиталом.",
    topics: [
      "Target-date vs three-fund portfolio",
      "Roth vs Traditional 2026 limits",
      "Bond tent без паники",
    ],
    affiliates: [
      { name: "Public, M1, SoFi, TradingView", typical: "$50–150 funded" },
      { name: "Personal Capital / Empower", typical: "$50–100" },
    ],
    verify: [
      "Каналы: Ben Felix (высокое качество), faceless «Two Cents»-стиль. Сравните RPM у finance vs motivation.",
    ],
    risks: [
      "Инвестсоветы = дисклеймер «not financial advice» + риск limited ads.",
      "SEC/FTC чувствительность. Не обещайте доходность.",
    ],
    fit: "Для фабрики тяжело: нельзя штамповать. Лучше как вторичный канал через 6 месяцев.",
    firstVideos: [
      "The 2026 contribution limits in one table",
      "What actually changed after last year’s market",
    ],
  },
  {
    id: "insurance-explain",
    name: "Страхование для людей (term life, renters, auto)",
    tagline: "CPM среди самых высоких. Комплаенс и лицензии — главный тормоз.",
    recommended: false,
    cpm: [20, 50],
    rpm: [7, 17],
    difficulty: "очень высокая",
    faceless: true,
    whyHighCpm: "CAC полиса $150–800. Реклама идёт даже на маленькие ролики, если geo US.",
    topics: [
      "Term vs whole — без продажи «инвестиции»",
      "Renters insurance за $15: что покрывает",
      "Как читать декларацию auto",
    ],
    affiliates: [
      { name: "Policygenius, NerdWallet insurance, SelectQuote", typical: "$20–80 lead" },
    ],
    verify: [
      "Проверьте, можно ли вам продвигать insurance в вашей юрисдикции. Многие сети требуют US entity.",
    ],
    risks: [
      "Без лицензии — только образование, не «купите полис у меня».",
      "Limited or no ads на medical/health пересечениях.",
    ],
    fit: "Не берите в месяц 1. Слишком много юридического трения для соло.",
    firstVideos: [
      "Term life in 11 minutes (no sales script)",
    ],
  },
  {
    id: "real-estate-money",
    name: "Ипотека и first-time homebuyer (US)",
    tagline: "Высокий CPM, сезонность ставок, нужна свежесть цифр каждую неделю.",
    recommended: false,
    cpm: [15, 40],
    rpm: [6, 15],
    difficulty: "высокая",
    faceless: true,
    whyHighCpm: "Лендеры и realtor-платформы платят за квалифицированный интент.",
    topics: [
      "Points vs rate в этом месяце",
      "FHA vs conventional 2026",
      "How much house at $X income",
    ],
    affiliates: [
      { name: "LendingTree, Bankrate mortgage, Rocket (если открыто)", typical: "$20–80 lead" },
    ],
    verify: [
      "Сравните выдачу «mortgage rates today» — живая реклама = живой CPM.",
    ],
    risks: [
      "Цифры гниют за 48 часов. Без привычки обновлять — канал теряет доверие.",
    ],
    fit: "Хороший второй канал, если уже умеете таблицы и голос. Не первый.",
    firstVideos: [
      "First-time buyer checklist with today’s rate math",
    ],
  },
  {
    id: "ai-not-finance",
    name: "Не берите: motivational / prank / gaming Shorts",
    tagline: "Дешёвые просмотры, RPM $0.5–3, к $1k чистыми не сходятся без миллионов views.",
    recommended: false,
    cpm: [1, 6],
    rpm: [0.4, 2],
    difficulty: "средняя",
    faceless: true,
    whyHighCpm: "CPM низкий: рекламодатели — игры, VPN mass-market, приложения.",
    topics: ["Любые виральные шаблоны"],
    affiliates: [{ name: "VPN mass-market", typical: "$5–20" }],
    verify: [
      "Посчитайте: 100k Shorts views × $0.04 RPM = $4. До $2k нужно порядка 50 млн views — не реалистично за 6 месяцев соло.",
    ],
    risks: [
      "С 1 февраля 2027 Shorts ads требуют 10 млн qualified views / 90 дней даже внутри YPP.",
    ],
    fit: "Прямо противоречит цели. Оставляем как антипример.",
    firstVideos: [],
  },
]

export const PRIMARY_NICHE = niches[0]
