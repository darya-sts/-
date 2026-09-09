export type TaskStatus =
  | "new"
  | "planned"
  | "in_progress"
  | "rework"
  | "review"
  | "done"
  | "cancelled"

export type TaskPriority = "low" | "medium" | "high" | "urgent"

export type ChecklistActor = "user" | "bot"

export type ChatRole = "user" | "bot" | "system"

export type ChatMessageType = "text" | "checklist_update" | "status_change" | "question"

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  completedAt?: number
  completedBy?: ChecklistActor
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: number
  type?: ChatMessageType
}

export interface TaskChat {
  messages: ChatMessage[]
  isBotActive: boolean
  botContext?: {
    currentAction: string
    progress: number
  }
}

export interface TaskBotConfig {
  apiKeyName?: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: number
  updatedAt: number
  deadline?: number
  checklist: ChecklistItem[]
  chat?: TaskChat
  botConfig?: TaskBotConfig
}

export const TASK_STATUSES = [
  { id: "new", label: "Новая", color: "gray" },
  { id: "planned", label: "В плане", color: "blue" },
  { id: "in_progress", label: "В работе", color: "yellow" },
  { id: "rework", label: "На доработке", color: "orange" },
  { id: "review", label: "На проверке", color: "purple" },
  { id: "done", label: "Выполнена", color: "green" },
  { id: "cancelled", label: "Отменена", color: "red" },
] as const

export const TASK_PRIORITIES = [
  { id: "low", label: "Низкий", color: "gray", icon: "ArrowDown" },
  { id: "medium", label: "Средний", color: "blue", icon: "Minus" },
  { id: "high", label: "Высокий", color: "orange", icon: "ArrowUp" },
  { id: "urgent", label: "Срочный", color: "red", icon: "AlertTriangle" },
] as const

export type TaskSortBy = "created" | "priority" | "status"

export const STORAGE_KEYS = {
  tasks: "forgemill-tasks",
  taskChats: "forgemill-task-chats",
  settings: "forgemill-settings",
} as const

export const BOT_MESSAGES = {
  starting: "🚀 Начинаю работу над задачей...",
  analyzing: "📊 Анализирую контекст...",
  planning: "📋 Составляю план действий...",
  executing: "⚡️ Выполняю пункты чек-листа...",
  question: "❓ Уточняющий вопрос:",
  done: "✅ Задача выполнена!",
  error: "❌ Не удалось выполнить. Попробуйте уточнить задачу.",
} as const
