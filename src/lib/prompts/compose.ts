import { PROMPT_AGENTS, PROMPT_MODELS } from "@/data/prompts"
import type { DelegateInput, ModelTier, PromptRecord } from "@/lib/prompts/types"

export type ComposeExtras = {
  directions?: { id: string; label: string }[]
  skills?: string[]
  rules?: string[]
  recommendedTier?: ModelTier
  modelId?: string
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "prompt"
}

export function recommendModelTier(request: string): ModelTier {
  const text = request.toLowerCase()
  if (/(архитектур|сложн|рефактор|безопасн|миграц|distributed|security)/i.test(text)) return "fast"
  if (/(прост|опечатк|переимен|readme|коммент|типограф)/i.test(text)) return "economy"
  return "balanced"
}

export function deriveTitle(request: string, title?: string) {
  const given = title?.trim()
  if (given) return given.slice(0, 80)
  return (request.trim().split(/\n/)[0] || "Промт").slice(0, 80)
}

export function composePrompt(request: string, title?: string, extras: ComposeExtras = {}) {
  const resolvedTitle = deriveTitle(request, title)
  const recommendedTier = extras.recommendedTier ?? recommendModelTier(request)
  const directionLines = (extras.directions ?? []).map((item) => `- ${item.label} (\`${item.id}\`)`)
  const skillLines = (extras.skills ?? []).map((item) => `- ${item}`)
  const ruleLines = (extras.rules ?? []).map((item) => `- ${item}`)
  const body = [
    `# ${resolvedTitle}`,
    "",
    "## Цель",
    request.trim(),
    "",
    "## Направления",
    directionLines.length ? directionLines.join("\n") : "- (не указаны)",
    "",
    "## Контекст",
    "- Репозиторий: Forge Mill — кабинет контент-фабрики (Next.js, static export).",
    "- Соблюдать дизайн-систему кабинета: карточки `#dceef8`, кнопки `#0b66c3`, TT Commons.",
    "- Не ломать Задачи, Агенты, Базу паролей и live-разделы MarvinBot/Architecture.",
    "",
    skillLines.length ? "## Навыки" : null,
    skillLines.length ? skillLines.join("\n") : null,
    skillLines.length ? "" : null,
    ruleLines.length ? "## Правила" : null,
    ruleLines.length ? ruleLines.join("\n") : null,
    ruleLines.length ? "" : null,
    "## Требования к результату",
    "1. Выполни задачу полностью, без заглушек.",
    "2. Покрой проверками (build / e2e / ручная проверка по ситуации).",
    "3. Если выбрана публикация Git — закоммить и запушь в рабочую ветку (без force-push).",
    "4. Дай краткий отчёт: что сделано и где лежит артефакт.",
    "",
    "## Ограничения",
    "- Секреты не коммитить.",
    "- Комментарии в коде — на русском, где это принято в проекте.",
    "",
    "## Рекомендуемый тариф модели",
    extras.modelId ? `- ${recommendedTier} · \`${extras.modelId}\`` : `- ${recommendedTier}`,
  ]
    .filter((line) => line !== null)
    .join("\n")
  return { title: resolvedTitle, body, recommendedTier }
}

export function buildPackageMarkdown(prompt: PromptRecord, dto: DelegateInput) {
  const agents = PROMPT_AGENTS.filter((agent) => dto.agents.includes(agent.id))
  const model = PROMPT_MODELS.find((item) => item.id === dto.modelId)
  const agentLines = agents
    .map((agent) => `- **${agent.name}** (\`${agent.id}\`): ${dto.agentRoles[agent.id] || "роль не указана"}`)
    .join("\n")
  const directionLine = (prompt.directions ?? []).length ? `directions: ${prompt.directions.join(", ")}` : null
  return [
    `# Cursor Task: ${prompt.title}`,
    "",
    `promptId: \`${prompt.id}\``,
    directionLine,
    `priority: **${dto.priority}**`,
    dto.deadline ? `deadline: ${dto.deadline}` : null,
    dto.inputRef ? `input: ${dto.inputRef}` : null,
    "",
    "## Модель",
    `- Tier: **${dto.modelTier}**`,
    `- Model: \`${dto.modelId}\`${model ? ` (${model.name})` : ""}`,
    "",
    "## Агенты",
    agentLines || "- (не выбраны)",
    "",
    "## Публикация",
    dto.publications.map((item) => `- ${item}`).join("\n") || "- chat",
    "",
    "## Память",
    dto.saveToMemory ? `- Сохранить: ${dto.memoryItems.join(", ") || "базовый контекст"}` : "- Не сохранять",
    "",
    "## Подтверждение",
    "- Режим: **ручное подтверждение** параметров перед стартом (уже получено).",
    "",
    "## Промт",
    "",
    prompt.body,
    "",
    "## Исходный запрос пользователя",
    "",
    prompt.request,
    "",
    "## Инструкция исполнителю Cursor",
    "1. Выполни промт выше выбранными агентами/моделью.",
    "2. Опубликуй результат согласно списку publications.",
    "3. Верни краткий отчёт: статус, модель, пути артефактов, память.",
  ]
    .filter((line) => line !== null)
    .join("\n")
}
