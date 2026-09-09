import {
  STORAGE_KEYS,
  type Task,
  type TaskPriority,
  type TaskSortBy,
  type TaskStatus,
} from "./types"

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const STATUS_RANK: Record<TaskStatus, number> = {
  new: 0,
  planned: 1,
  in_progress: 2,
  rework: 3,
  review: 4,
  done: 5,
  cancelled: 6,
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export const DEMO_TASKS: Task[] = [
  {
    id: "demo-landing",
    title: "Создать landing page",
    description: "Разработать главную страницу с анимациями для Forge Mill.",
    status: "in_progress",
    priority: "high",
    createdAt: Date.now() - 86_400_000,
    updatedAt: Date.now() - 3_600_000,
    checklist: [
      { id: "1a", text: "Дизайн макета", completed: true, completedAt: Date.now() - 40_000_000, completedBy: "user" },
      { id: "1b", text: "Верстка", completed: false },
      { id: "1c", text: "Анимации", completed: false },
      { id: "1d", text: "Адаптив", completed: false },
      { id: "1e", text: "Проверка CTA и форм", completed: false },
    ],
  },
  {
    id: "demo-ypp",
    title: "Подготовить заявку YPP",
    description: "Собрать доказательства ниши, стека MCP и ритма публикаций до 1 февраля 2027.",
    status: "planned",
    priority: "urgent",
    createdAt: Date.now() - 172_800_000,
    updatedAt: Date.now() - 86_400_000,
    deadline: Date.UTC(2027, 1, 1),
    checklist: [
      { id: "2a", text: "Ниша EN зафиксирована", completed: true, completedBy: "user" },
      { id: "2b", text: "Стек MCP в Cursor", completed: true, completedBy: "user" },
      { id: "2c", text: "10+ лонгов на канале", completed: false },
      { id: "2d", text: "Часы просмотра к порогу", completed: false },
      { id: "2e", text: "Черновик заявки", completed: false },
    ],
  },
]

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false
  const task = value as Task
  return typeof task.id === "string" && typeof task.title === "string" && Array.isArray(task.checklist)
}

export type TaskUiSettings = {
  filterStatus: TaskStatus | "all"
  sortBy: TaskSortBy
}

const DEFAULT_SETTINGS: TaskUiSettings = {
  filterStatus: "all",
  sortBy: "created",
}

export function loadTaskSettings(): TaskUiSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  const raw = window.localStorage.getItem(STORAGE_KEYS.settings)
  if (!raw) return DEFAULT_SETTINGS
  try {
    const parsed = JSON.parse(raw) as Partial<TaskUiSettings>
    const filterStatus = parsed.filterStatus ?? "all"
    const sortBy = parsed.sortBy ?? "created"
    const statusOk = filterStatus === "all" || filterStatus in STATUS_RANK
    const sortOk = sortBy === "created" || sortBy === "priority" || sortBy === "status"
    return {
      filterStatus: statusOk ? filterStatus : "all",
      sortBy: sortOk ? sortBy : "created",
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveTaskSettings(settings: TaskUiSettings): void {
  window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
}

export function sortAndFilter(
  tasks: Task[],
  options: {
    status?: TaskStatus | "all"
    searchQuery?: string
    sortBy?: TaskSortBy
  }
): Task[] {
  const status = options.status ?? "all"
  const searchQuery = (options.searchQuery ?? "").trim().toLowerCase()
  const sortBy = options.sortBy ?? "created"
  let list = tasks
  if (status !== "all") list = list.filter((task) => task.status === status)
  if (searchQuery) {
    list = list.filter(
      (task) =>
        task.title.toLowerCase().includes(searchQuery) ||
        task.description.toLowerCase().includes(searchQuery)
    )
  }
  return [...list].sort((a, b) => {
    if (sortBy === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (sortBy === "status") return STATUS_RANK[a.status] - STATUS_RANK[b.status]
    return b.createdAt - a.createdAt
  })
}

export function checklistStats(items: { completed: boolean }[]) {
  const total = items.length
  const done = items.filter((item) => item.completed).length
  return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) }
}

export class TaskStorage {
  load(): Task[] {
    if (typeof window === "undefined") return []
    const raw = window.localStorage.getItem(STORAGE_KEYS.tasks)
    if (!raw) return []
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.filter(isTask)
    } catch {
      return []
    }
  }

  save(tasks: Task[]): void {
    window.localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks))
  }

  seedDemoIfEmpty(): Task[] {
    const existing = this.load()
    if (existing.length > 0) return existing
    this.save(DEMO_TASKS)
    return DEMO_TASKS
  }

  get(id: string): Task | undefined {
    return this.load().find((task) => task.id === id)
  }

  create(input: Pick<Task, "title" | "description" | "priority"> & Partial<Task>): Task {
    const now = Date.now()
    const task: Task = {
      id: newId(),
      title: input.title.trim(),
      description: input.description.trim(),
      status: input.status ?? "new",
      priority: input.priority,
      createdAt: now,
      updatedAt: now,
      deadline: input.deadline,
      checklist: input.checklist ?? [],
      chat: input.chat,
      botConfig: input.botConfig,
    }
    const tasks = this.load()
    tasks.unshift(task)
    this.save(tasks)
    return task
  }

  update(id: string, patch: Partial<Task>): Task | undefined {
    const tasks = this.load()
    const index = tasks.findIndex((task) => task.id === id)
    if (index < 0) return undefined
    const next: Task = { ...tasks[index], ...patch, id, updatedAt: Date.now() }
    tasks[index] = next
    this.save(tasks)
    return next
  }

  delete(id: string): void {
    this.save(this.load().filter((task) => task.id !== id))
  }

  query(options: {
    status?: TaskStatus | "all"
    searchQuery?: string
    sortBy?: TaskSortBy
  }): Task[] {
    return sortAndFilter(this.load(), options)
  }
}

export const taskStorage = new TaskStorage()
