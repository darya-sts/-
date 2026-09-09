export type ProjectBot = {
  id: string
  name: string
  hint: string
}

/** Preset executors from the Forge Mill / Cursor stack. Cursor Cloud API is not available in the static app. */
export const PROJECT_BOTS: ProjectBot[] = [
  { id: "task-bot", name: "TaskBot", hint: "Эмуляция агента задач" },
  { id: "marvinbot", name: "MarvinBot", hint: "Дайджесты Telegram и статьи" },
  { id: "cursor-agent", name: "Cursor Agent", hint: "Агент в Cursor" },
  { id: "architect", name: "Architect", hint: "Mindmap и архитектура" },
]

export function botLabel(id: string | undefined): string {
  if (!id) return "Не назначен"
  if (id.startsWith("custom:")) return id.slice(7) || "Свой бот"
  return PROJECT_BOTS.find((bot) => bot.id === id)?.name ?? id
}
