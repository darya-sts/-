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

export type TaskViewMode = "list" | "kanban"

export type AttachmentKind = "file" | "image" | "link"

export interface TaskCategory {
  id: string
  name: string
  createdAt: number
}

export interface TaskBoard {
  id: string
  name: string
  /** `null` = все задачи, `"none"` = без категории */
  categoryId: string | null
  createdAt: number
}

export interface TaskAttachment {
  id: string
  kind: AttachmentKind
  name: string
  url?: string
  mimeType?: string
  size?: number
  title?: string
  excerpt?: string
  createdAt: number
}

export interface TaskMemoryRecord {
  id: string
  taskId: string
  title: string
  savedAt: number
  path: string
  markdown: string
  json: Record<string, unknown>
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
  categoryId?: string | null
  executorBotId?: string
  attachments?: TaskAttachment[]
  result?: string
  memorySavedAt?: number
  memoryPath?: string
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
  categories: "forgemill-task-categories",
  boards: "forgemill-task-boards",
  memory: "forgemill-task-memory",
} as const

export const ALL_BOARD_ID = "board-all"
export const NONE_BOARD_ID = "board-none"
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

export const BOT_MESSAGES = {
  starting: "🚀 Начинаю работу над задачей...",
  analyzing: "📊 Анализирую контекст...",
  planning: "📋 Составляю план действий...",
  executing: "⚡️ Выполняю пункты чек-листа...",
  question: "❓ Уточняющий вопрос:",
  done: "✅ Задача выполнена!",
  error: "❌ Не удалось выполнить. Попробуйте уточнить задачу.",
} as const
