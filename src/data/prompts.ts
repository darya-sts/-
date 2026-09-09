import type { AgentDef, ModelDef } from "@/lib/prompts/types"

export const PROMPT_AGENTS: AgentDef[] = [
  { id: "generalPurpose", name: "General Purpose", description: "Многошаговые задачи, исследование и исполнение", defaultRole: "Координация и выполнение основной задачи" },
  { id: "explore", name: "Explore", description: "Быстрый поиск по кодовой базе", defaultRole: "Найти файлы, точки входа, зависимости" },
  { id: "debug", name: "Debug", description: "Гипотезы и runtime-диагностика", defaultRole: "Найти и подтвердить причину бага" },
  { id: "computerUse", name: "Computer Use", description: "Ручное UI-тестирование в браузере", defaultRole: "Проверить UI и снять артефакты" },
  { id: "videoReview", name: "Video Review", description: "Разбор видео-артефактов", defaultRole: "Проверить содержимое демо-видео" },
  { id: "cursor-guide", name: "Cursor Guide", description: "Документация продуктов Cursor", defaultRole: "Ответить по возможностям Cursor" },
  { id: "ci-investigator", name: "CI Investigator", description: "Диагностика упавших CI checks", defaultRole: "Найти причину падения CI" },
  { id: "bugbot", name: "Bugbot", description: "Ревью изменений на баги", defaultRole: "Проверить diff на дефекты" },
  { id: "security-review", name: "Security Review", description: "Security-ревью изменений", defaultRole: "Оценить риски безопасности" },
  { id: "coding", name: "Coding Agent", description: "Реализация фич и правок кода", defaultRole: "Написать/изменить код" },
  { id: "research", name: "Research Agent", description: "Исследование и сбор контекста", defaultRole: "Собрать факты и варианты" },
  { id: "writing", name: "Writing Agent", description: "Документация и тексты", defaultRole: "Подготовить текст/доки" },
  { id: "refactoring", name: "Refactoring Agent", description: "Рефакторинг без смены поведения", defaultRole: "Улучшить структуру кода" },
  { id: "testing", name: "Testing Agent", description: "Тесты и проверка качества", defaultRole: "Добавить/прогнать тесты" },
  { id: "devops", name: "DevOps Agent", description: "Деплой, Docker, CI/CD", defaultRole: "Настроить запуск и деплой" },
  { id: "data-analysis", name: "Data Analysis Agent", description: "Анализ данных и отчёты", defaultRole: "Разобрать данные и выводы" },
  { id: "frontend", name: "Frontend Agent", description: "UI/React/Next.js", defaultRole: "Сверстать и подключить UI" },
  { id: "python", name: "Python Agent", description: "Python-сервисы и скрипты", defaultRole: "Реализовать Python-часть" },
  { id: "ml", name: "ML Agent", description: "ML/LLM интеграции", defaultRole: "Подключить модели и пайплайны" },
]

export const PROMPT_MODELS: ModelDef[] = [
  { id: "composer-2.5-fast", name: "Composer 2.5 Fast", tier: "economy", speed: "высокая", cost: "низкая", quality: "хорошее для рутины", recommendedFor: "Простые правки, шаблоны, рутина" },
  { id: "gemini-3.8-flash-low", name: "Gemini 3.8 Flash Low", tier: "economy", speed: "высокая", cost: "низкая", quality: "базовое", recommendedFor: "Черновики и быстрые ответы" },
  { id: "claude-sonnet-5-thinking-low", name: "Claude Sonnet 5 Thinking Low", tier: "economy", speed: "средняя", cost: "низкая–средняя", quality: "стабильное", recommendedFor: "Небольшие задачи с рассуждением" },
  { id: "composer-2.5", name: "Composer 2.5", tier: "balanced", speed: "средняя", cost: "средняя", quality: "высокое", recommendedFor: "Обычная разработка по умолчанию" },
  { id: "claude-sonnet-5-thinking-medium", name: "Claude Sonnet 5 Thinking Medium", tier: "balanced", speed: "средняя", cost: "средняя", quality: "высокое", recommendedFor: "Фичи средней сложности" },
  { id: "gpt-5.6-sol-medium", name: "GPT 5.6 Sol Medium", tier: "balanced", speed: "средняя", cost: "средняя", quality: "высокое", recommendedFor: "Смешанные coding + reasoning задачи" },
  { id: "claude-opus-5-thinking-high", name: "Claude Opus 5 Thinking High", tier: "fast", speed: "ниже", cost: "высокая", quality: "максимальное", recommendedFor: "Сложная архитектура и критичные баги" },
  { id: "claude-opus-5-thinking-xhigh", name: "Claude Opus 5 Thinking XHigh", tier: "fast", speed: "ниже", cost: "очень высокая", quality: "максимальное", recommendedFor: "Самые сложные мультиагентные задачи" },
  { id: "gpt-5.6-sol-xhigh", name: "GPT 5.6 Sol XHigh", tier: "fast", speed: "средняя", cost: "высокая", quality: "максимальное", recommendedFor: "Сложный код и глубокий анализ" },
]

export const PUBLICATION_OPTIONS = [
  { id: "project-file", label: "Файл в проекте", hint: "скачивается .md (как prompts/ и .cursor/tasks/)" },
  { id: "git", label: "Git commit + push", hint: "подсказка исполнителю Cursor" },
  { id: "markdown", label: "Markdown документ", hint: "отдельный .md" },
  { id: "pdf", label: "PDF / печать", hint: "печатный HTML, Save as PDF" },
  { id: "chat", label: "Вывод в кабинет", hint: "предпросмотр на шаге 3" },
] as const

export const MEMORY_OPTIONS = [
  { id: "prompt-body", label: "Полный текст промта" },
  { id: "agent-output", label: "Вывод агентов" },
  { id: "models-used", label: "Использованные модели" },
  { id: "key-decisions", label: "Ключевые решения" },
] as const

export const DEFAULT_AGENTS = ["coding", "explore"]
export const DEFAULT_PUBLICATIONS = ["project-file", "git", "chat"]
export const DEFAULT_MEMORY_ITEMS = ["prompt-body", "key-decisions"]
