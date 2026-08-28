export type PlatformRule = {
  platform: "YouTube" | "X" | "Telegram"
  updated: string
  headline: string
  tiers: { name: string; need: string[]; earn: string[] }[]
  notes: string[]
  sources: { label: string; href: string }[]
}

export const platforms: PlatformRule[] = [
  {
    platform: "YouTube",
    updated: "август 2026 (анонс изменений с 1 февраля 2027)",
    headline:
      "Сейчас ещё действуют пороги 2018/2023. Успейте войти в YPP до 1 февраля 2027 — для новых заявителей часы и Shorts удваивают.",
    tiers: [
      {
        name: "Fan funding и шопинг (нижний порог)",
        need: [
          "500 подписчиков",
          "3 публичных загрузки за 90 дней",
          "3 000 qualified watch hours / 365 дней или 3 млн qualified Shorts / 90 дней",
        ],
        earn: [
          "Channel memberships",
          "Super Chat, Super Stickers, Super Thanks",
          "Shopping (отдельные лимиты для полки брендов — до 10 000 подп.)",
        ],
      },
      {
        name: "Реклама и Premium — сейчас (до 1 фев 2027)",
        need: [
          "1 000 подписчиков",
          "4 000 qualified public watch hours / 365 дней или 10 млн qualified Shorts views / 90 дней",
          "18+ или опекун на AdSense, страна YPP, advertiser-friendly",
        ],
        earn: [
          "Watch Page ads (создатель ~55% после вычета YouTube)",
          "Shorts Feed ads (сейчас; доля ниже лонга)",
          "YouTube Premium и Premium Lite: пул 30% net Premium / 60% Lite, далее 55% лонг / 45% Shorts создателю",
        ],
      },
      {
        name: "Реклама и Premium — новые заявители с 1 февраля 2027",
        need: [
          "1 000 подписчиков (без изменений)",
          "8 000 часов / 365 дней или 20 млн Shorts / 90 дней",
          "Уже принятые партнёры «дедушкины» по входу, но должны принять новые terms до 31 января 2027",
        ],
        earn: [
          "Те же ads + Premium",
          "Shorts ads внутри YPP с 1 фев 2027 только при 10 млн qualified Shorts / 90 дней; ниже — лонги монетизируются, Shorts — нет, пока снова не перейдёте порог",
        ],
      },
    ],
    notes: [
      "Просмотры с рекламных кампаний YouTube Ads не считаются в порог, кроме follow-on (органических после промо).",
      "Long-form 8+ минут открывает mid-roll и сильно поднимает RPM относительно 7:59.",
      "RPM ≈ 30–50% ниже «рекламного CPM»: YouTube забирает ~45%, не на каждый просмотр есть показ.",
      "Q4 (окт–дек) CPM +20–50%. Ваш месяц 4 как раз туда попадает — не уходите в развлекательный контент.",
      "Made for Kids почти убивает RPM и закрывает Super Thanks / memberships.",
    ],
    sources: [
      { label: "YouTube Help: How to earn money", href: "https://support.google.com/youtube/answer/72857" },
      {
        label: "YouTube Blog: YPP updates (10 авг 2026)",
        href: "https://blog.youtube/news-and-events/youtube-partner-program-updates-2027-new-opportunities-earn/",
      },
    ],
  },
  {
    platform: "X",
    updated: "август 2026",
    headline:
      "Creator Revenue Sharing закрыт для новичков с 7 августа 2026 и полностью заканчивается 7 сентября. Вместо него — Original Content Rewards: платят за оригинальность, не за накрутку вовлечения.",
    tiers: [
      {
        name: "Original Content Rewards",
        need: [
          "18+",
          "Страна программы",
          "X Premium, Premium+ или Premium Business (не Basic за $3)",
          "≥ 500 verified followers",
          "≥ 500 000 Home Timeline impressions от verified-пользователей за 90 дней (реплаи не считаются)",
          "Регулярно публиковать original content",
        ],
        earn: [
          "Выплаты за qualified impressions оригинальных постов (уникальные, ≥50% поста на экране, от Premium-пользователей)",
          "Раз в две недели, минимум $30, Stripe или X Money",
          "Подписки на автора и чаевые — отдельно, если доступны в стране",
        ],
      },
    ],
    notes: [
      "Не засчитывается: копипаст, резаный репост с другой платформы, «automated means», engagement bait («like and RT»).",
      "Засчитывается: свой разбор, репортаж, комментарий с добавленной ценностью, свои фото/схемы/мемы.",
      "Поэтому фабрика не может быть «n8n постит транскрипт YouTube каждые 2 часа». Cursor готовит черновик, вы утверждаете тезис.",
      "Покупайте Premium на web ($8/мес или $84/год), не в iOS/Android — там дороже.",
      "Старый Revenue Sharing: финальные выплаты примерно 14 авг, 28 авг и ~11 сен 2026. К этой фабрике не относится, если вы не были внутри.",
    ],
    sources: [
      { label: "X Help / Creator Studio", href: "https://x.com/i/creatorstudio" },
      {
        label: "Разбор Original Content Rewards, авг 2026",
        href: "https://arwriterai.com/en/blog/x-original-content-rewards-creators-2026/",
      },
    ],
  },
  {
    platform: "Telegram",
    updated: "2026",
    headline:
      "Три независимых крана: ads 50% в публичном канале от 1 000, Stars (посты, реакции, подписки), Suggested Posts. Вывод — через Fragment в TON/GRAM.",
    tiers: [
      {
        name: "Channel ads revenue share",
        need: ["Публичный канал", "≥ 1 000 подписчиков", "Регион и тематика не в стоп-листе"],
        earn: [
          "50% выручки Telegram с sponsored messages в вашем канале",
          "Вывод в TON/GRAM через Fragment, без комиссии Telegram",
        ],
      },
      {
        name: "Telegram Stars",
        need: ["Канал или бот", "2FA", "Для вывода: Fragment KYC, некастодиальный TON-кошелёк"],
        earn: [
          "Платные посты (unlock за Stars)",
          "Star-реакции — 100% создателю",
          "Ежемесячная подписка по invite link (Require Monthly Fee)",
          "≈ $0.013 за Star создателю; минимум вывода 1 000 Stars; холд 21 день на каждую пачку; срок жизни Stars 3 года",
        ],
      },
      {
        name: "Suggested Posts",
        need: ["Канал любого размера"],
        earn: ["Бренды и фанаты предлагают пост за Stars/TON, вы публикуете и получаете оплату"],
      },
    ],
    notes: [
      "Приватный канал на 50 000 не получит channel ads — реклама только в публичных.",
      "Поэтому сетка: публичный (охват + ads) и отдельный VIP (Stars). Не прячьте весь контент.",
      "Реклама Telegram Ads сама по себе — расход: минимум ~0.1 TON CPM, кнопка только внутрь Telegram (бот/канал/пост), не на сайт.",
      "Купить Stars и вывести их нельзя: только заработанные.",
    ],
    sources: [
      {
        label: "Telegram: Super Channels, Stars, Subscriptions",
        href: "https://telegram.org/blog/superchannels-star-reactions-subscriptions/",
      },
      { label: "Fragment: вывод Stars", href: "https://fragment.com" },
    ],
  },
]
