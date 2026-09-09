import type { DirectionProfile } from "@/lib/prompts/types"

export const BUILTIN_DIRECTIONS: DirectionProfile[] = [
  {
    id: "design",
    label: "Дизайн",
    builtin: true,
    agents: ["frontend", "computerUse", "writing"],
    skills: [
      "Сверстать UI в палитре кабинета: карточки #dceef8, кнопки #0b66c3, TT Commons.",
      "Проверить адаптив desktop и mobile, не ломать сайдбар и хлебные крошки.",
    ],
    rules: [
      "Не менять глобальную тему ради одной страницы.",
      "Пустые состояния и фокус с клавиатуры обязательны.",
    ],
    modelTier: "balanced",
    modelId: "composer-2.5",
    keywords: ["дизайн", "макет", "ui", "ux", "вёрстк", "верстк", "адаптив", "кнопк", "экран", "layout", "palette"],
  },
  {
    id: "marketing",
    label: "Маркетинг",
    builtin: true,
    agents: ["writing", "research", "data-analysis"],
    skills: [
      "Собрать оффер, каналы и CTA без хайпа.",
      "Цифры CPM/цены только с пометкой [VERIFY] или источником.",
    ],
    rules: [
      "Не выдумывать живые ставки рекламы.",
      "Голос: specific, numeric, no hype, аудитория US/UK solopreneurs.",
    ],
    modelTier: "balanced",
    modelId: "claude-sonnet-5-thinking-medium",
    keywords: ["маркетинг", "оффер", "cta", "реклам", "воронк", "лид", "контент-план", "пост", "рассылк"],
  },
  {
    id: "consulting",
    label: "Консультации",
    builtin: true,
    agents: ["research", "writing", "generalPurpose"],
    skills: [
      "Разобрать задачу на варианты с плюсами, минусами и риском.",
      "Дать рекомендацию и что проверить руками.",
    ],
    rules: [
      "Не обещать результат без оговорок.",
      "Сначала факты, потом мнение.",
    ],
    modelTier: "balanced",
    modelId: "gpt-5.6-sol-medium",
    keywords: ["консультац", "совет", "как лучше", "сравни", "вариант", "рекоменд", "стратег"],
  },
  {
    id: "research",
    label: "Сбор информации",
    builtin: true,
    agents: ["explore", "research", "cursor-guide"],
    skills: [
      "Найти источники в репозитории и кратко законспектировать.",
      "Пометить неподтверждённое как [VERIFY].",
    ],
    rules: [
      "Не выдавать догадку за факт.",
      "Список находок важнее длинного эссе.",
    ],
    modelTier: "economy",
    modelId: "composer-2.5-fast",
    keywords: ["собери", "найди", "исслед", "ресерч", "источник", "конкурент", "факт", "документац"],
  },
  {
    id: "development",
    label: "Разработка",
    builtin: true,
    agents: ["coding", "explore", "testing", "debug"],
    skills: [
      "Реализовать фичу в существующих паттернах Next.js кабинета.",
      "Покрыть проверкой build/e2e или описать, что прогнать.",
    ],
    rules: [
      "Не ломать Задачи, Агенты, Vault, MarvinBot, Architecture.",
      "Без заглушек и без force-push.",
    ],
    modelTier: "balanced",
    modelId: "composer-2.5",
    keywords: ["код", "разработ", "баг", "фич", "рефактор", "тест", "api", "компонент", "typescript", "next"],
  },
  {
    id: "admin",
    label: "Администрирование",
    builtin: true,
    agents: ["devops", "ci-investigator", "security-review"],
    skills: [
      "Деплой overlay: не rsync GitHub поверх live-дерева.",
      "Проверить порты, compose и что auth/layout на месте.",
    ],
    rules: [
      "Секреты не коммитить.",
      "Не force-push и не merge PR без запроса.",
    ],
    modelTier: "fast",
    modelId: "claude-opus-5-thinking-high",
    keywords: ["деплой", "docker", "nginx", "vps", "ci", "сервер", "overlay", "compose", "ssl", "бэкап"],
  },
]
