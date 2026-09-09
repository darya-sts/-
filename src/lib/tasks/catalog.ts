import { ALL_BOARD_ID, NONE_BOARD_ID, STORAGE_KEYS, type TaskBoard, type TaskCategory } from "./types"
import { newId } from "./id"

const DEMO_CATEGORIES: TaskCategory[] = [
  { id: "cat-dev", name: "Разработка", createdAt: 1 },
  { id: "cat-mkt", name: "Маркетинг", createdAt: 2 },
  { id: "cat-design", name: "Дизайн", createdAt: 3 },
]

const DEMO_BOARDS: TaskBoard[] = [
  { id: ALL_BOARD_ID, name: "Все задачи", categoryId: null, createdAt: 1 },
  { id: NONE_BOARD_ID, name: "Без категории", categoryId: "none", createdAt: 2 },
  { id: "board-dev", name: "Разработка", categoryId: "cat-dev", createdAt: 3 },
  { id: "board-mkt", name: "Маркетинг", categoryId: "cat-mkt", createdAt: 4 },
  { id: "board-design", name: "Дизайн", categoryId: "cat-design", createdAt: 5 },
]

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadCategories(): TaskCategory[] {
  const list = readJson<TaskCategory[]>(STORAGE_KEYS.categories, [])
  return Array.isArray(list) ? list : []
}

export function saveCategories(list: TaskCategory[]) {
  window.localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(list))
}

export function loadBoards(): TaskBoard[] {
  const list = readJson<TaskBoard[]>(STORAGE_KEYS.boards, [])
  return Array.isArray(list) ? list : []
}

export function saveBoards(list: TaskBoard[]) {
  window.localStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(list))
}

export function seedCatalogIfEmpty(): { categories: TaskCategory[]; boards: TaskBoard[] } {
  let categories = loadCategories()
  let boards = loadBoards()
  if (categories.length === 0) {
    categories = DEMO_CATEGORIES
    saveCategories(categories)
  }
  if (boards.length === 0) {
    boards = DEMO_BOARDS
    saveBoards(boards)
  }
  if (!boards.some((board) => board.id === ALL_BOARD_ID)) {
    boards = [{ id: ALL_BOARD_ID, name: "Все задачи", categoryId: null, createdAt: 1 }, ...boards]
    saveBoards(boards)
  }
  if (!boards.some((board) => board.id === NONE_BOARD_ID)) {
    boards = [
      ...boards.filter((board) => board.id === ALL_BOARD_ID),
      { id: NONE_BOARD_ID, name: "Без категории", categoryId: "none", createdAt: 2 },
      ...boards.filter((board) => board.id !== ALL_BOARD_ID),
    ]
    saveBoards(boards)
  }
  return { categories, boards }
}

export function createCategory(name: string): TaskCategory {
  const category: TaskCategory = { id: newId(), name: name.trim(), createdAt: Date.now() }
  saveCategories([...loadCategories(), category])
  return category
}

export function renameCategory(id: string, name: string) {
  saveCategories(loadCategories().map((item) => (item.id === id ? { ...item, name: name.trim() } : item)))
}

export function deleteCategory(id: string) {
  saveCategories(loadCategories().filter((item) => item.id !== id))
  saveBoards(loadBoards().filter((board) => board.categoryId !== id || board.id === ALL_BOARD_ID || board.id === NONE_BOARD_ID))
}

export function createBoard(name: string, categoryId: string | null): TaskBoard {
  const board: TaskBoard = { id: newId(), name: name.trim(), categoryId, createdAt: Date.now() }
  saveBoards([...loadBoards(), board])
  return board
}

export function deleteBoard(id: string) {
  if (id === ALL_BOARD_ID || id === NONE_BOARD_ID) return
  saveBoards(loadBoards().filter((board) => board.id !== id))
}

export function categoryName(categories: TaskCategory[], id: string | null | undefined) {
  if (!id) return "Без категории"
  return categories.find((item) => item.id === id)?.name ?? "Без категории"
}
