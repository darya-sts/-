import {
  STORAGE_KEYS,
  type Task,
  type TaskBoard,
  type TaskPriority,
  type TaskSortBy,
  type TaskStatus,
  type TaskViewMode,
} from "./types"
import { newId } from "./id"

export { newId } from "./id"

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

export const DEMO_TASKS: Task[] = [
  {
    id: "demo-landing",
    title: "Создать landing page",
    description: "Разработать главную страницу с анимациями для Forge Mill.",
    status: "in_progress",
    priority: "high",
    createdAt: Date.now() - 86_400_000,
    updatedAt: Date.now() - 3_600_000,
    categoryId: "cat-design",
    executorBotId: "cursor-agent",
    attachments: [],
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
    categoryId: "cat-mkt",
    executorBotId: "marvinbot",
    attachments: [],
    checklist: [
      { id: "2a", text: "Ниша EN зафиксирована", completed: true, completedBy: "user" },
      { id: "2b", text: "Стек MCP в Cursor", completed: true, completedBy: "user" },
      { id: "2c", text: "10+ лонгов на канале", completed: false },
      { id: "2d", text: "Часы просмотра к порогу", completed: false },
      { id: "2e", text: "Черновик заявки", completed: false },
    ],
  },
]

function migrateTask(task: Task): Task {
  if (task.id === "demo-landing") {
    return {
      ...task,
      categoryId: task.categoryId ?? "cat-design",
      executorBotId: task.executorBotId ?? "cursor-agent",
      attachments: task.attachments ?? [],
    }
  }
  if (task.id === "demo-ypp") {
    return {
      ...task,
      categoryId: task.categoryId ?? "cat-mkt",
      executorBotId: task.executorBotId ?? "marvinbot",
      attachments: task.attachments ?? [],
    }
  }
  return { ...task, attachments: task.attachments ?? [] }
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false
  const task = value as Task
  return typeof task.id === "string" && typeof task.title === "string" && Array.isArray(task.checklist)
}

export type TaskUiSettings = {
  filterStatus: TaskStatus | "all"
  sortBy: TaskSortBy
  viewMode: TaskViewMode
  boardId: string
}

const DEFAULT_SETTINGS: TaskUiSettings = {
  filterStatus: "all",
  sortBy: "created",
  viewMode: "list",
  boardId: "board-all",
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
      viewMode: parsed.viewMode === "kanban" ? "kanban" : "list",
      boardId: typeof parsed.boardId === "string" && parsed.boardId ? parsed.boardId : "board-all",
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveTaskSettings(settings: TaskUiSettings): void {
  window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
}

export function readViewFromUrl(): Partial<Pick<TaskUiSettings, "viewMode" | "boardId">> {
  if (typeof window === "undefined") return {}
  const params = new URLSearchParams(window.location.search)
  const view = params.get("view")
  const board = params.get("board")
  return {
    viewMode: view === "kanban" || view === "list" ? view : undefined,
    boardId: board || undefined,
  }
}

export function writeViewToUrl(viewMode: TaskViewMode, boardId: string) {
  const url = new URL(window.location.href)
  url.searchParams.set("view", viewMode)
  url.searchParams.set("board", boardId)
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
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

export function filterByBoard(tasks: Task[], board: TaskBoard | undefined): Task[] {
  if (!board || board.categoryId === null) return tasks
  if (board.categoryId === "none") return tasks.filter((task) => !task.categoryId)
  return tasks.filter((task) => task.categoryId === board.categoryId)
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
      return parsed.filter(isTask).map(migrateTask)
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
      categoryId: input.categoryId ?? null,
      executorBotId: input.executorBotId,
      attachments: input.attachments ?? [],
      result: input.result,
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
