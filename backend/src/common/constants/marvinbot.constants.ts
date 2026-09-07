/** Категории контента MarvinBot Studio */
export const CATEGORIES = [
  'Инструменты ИИ',
  'Скилы и правила для Агентов',
  'Монетизация с помощью ИИ',
  'Прочее',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Ключевые слова для классификации категорий */
export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  'Инструменты ИИ': [
    'инструмент',
    'tool',
    'релиз',
    'release',
    'update',
    'обновление',
    'gpt',
    'claude',
    'gemini',
    'midjourney',
    'модель',
    'api',
    'sdk',
    'сравнение',
    'tutorial',
    'туториал',
    'chatgpt',
    'ollama',
    'langchain',
  ],
  'Скилы и правила для Агентов': [
    'агент',
    'agent',
    'скил',
    'skill',
    'prompt',
    'промпт',
    'правило',
    'rule',
    'архитектура',
    'multi-agent',
    'оркестратор',
    'best practice',
    'rag',
    'память',
    'memory',
    'tool calling',
    'функция',
  ],
  'Монетизация с помощью ИИ': [
    'монетизация',
    'заработ',
    'доход',
    'бизнес',
    'saas',
    'кейс',
    'продаж',
    'маркетинг',
    'клиент',
    'revenue',
    'pricing',
    'монетиз',
    'стартап',
    'freelance',
    'фриланс',
  ],
  Прочее: [
    'этика',
    'регулирован',
    'исследован',
    'paper',
    'закон',
    'safety',
    'безопасн',
    'политик',
  ],
};

export const EXPERT_TECH_KEYWORDS = [
  'исследование',
  'benchmark',
  'архитектура',
  'фреймворк',
  'релиз',
  'paper',
  'gpt',
  'llm',
  'агент',
  'multi-agent',
  'код',
  'code',
  'github',
  'arxiv',
  'latency',
  'токен',
  'transformer',
];

export const AD_KEYWORDS = [
  'купить',
  'скидка',
  'партнерка',
  'партнёрка',
  'промокод',
  'реклама',
  'подпишись и получи',
  'бесплатный вебинар',
  'только сегодня',
  'акция',
];

export const ARTICLE_PROMPT_TEMPLATE = `Ты — эксперт по ИИ. Напиши статью на русском языке на тему: {topic}

ИСТОЧНИКИ (посты из Telegram, уже сжаты до сути):
{selected_posts}

СТРУКТУРА (строго соблюдай):
## Введение
(2-3 предложения, зачем это важно)

## Ключевые тренды
(основные выводы из источников, 3-4 пункта)

## Практические рекомендации
(как применить, конкретные шаги)

## Инструменты и ресурсы
(ссылки на упомянутые инструменты)

## Заключение
(краткий итог и прогноз, 2-3 предложения)

ПРАВИЛА:
- Объем: 1500-2500 символов
- Язык: русский, деловой, без воды
- Формат: Markdown
- Добавь эмодзи: 📌 🚀 💡 ⚡ для структуры
- Если есть экспертное мнение — выдели 🟣 #expert
- Все ссылки — в конце (раздел "Источники")
- НЕ повторяй информацию
- ТОЛЬКО самое важное
- Максимум 2000 токенов

СГЕНЕРИРУЙ СТАТЬЮ СТРОГО ПО ЭТОЙ СТРУКТУРЕ.`;

export const COMPRESS_PROMPT = `Сожми этот пост до 2 предложений на русском, сохрани суть и факты: {text}`;

export const DEFAULTS = {
  schedule: '0 6,18 * * *',
  timezone: 'Asia/Novosibirsk',
  maxPostsPerDigest: 10,
  maxPostsPerArticle: 5,
  maxArticleTokens: 2000,
  maxArticleChars: 2500,
  language: 'ru',
  minPostLength: 30,
  maxPostLength: 5000,
  duplicateSimilarity: 0.85,
  digestRetentionDays: 30,
};