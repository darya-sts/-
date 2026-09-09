"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { Plus, Search } from "lucide-react"
import { BoardBar } from "@/components/tasks/board-bar"
import { KanbanBoard } from "@/components/tasks/kanban-board"
import { TaskDetail } from "@/components/tasks/task-detail"
import { TaskForm, valuesToChecklist, type TaskFormValues } from "@/components/tasks/task-form"
import { TaskList } from "@/components/tasks/task-list"
import { ViewToggle } from "@/components/tasks/view-toggle"
import { FIELD_CLASS } from "@/components/tasks/field-styles"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { loadBoards, loadCategories, seedCatalogIfEmpty, categoryName } from "@/lib/tasks/catalog"
import { buildTaskMemory, persistTaskMemory } from "@/lib/tasks/memory"
import {
  filterByBoard,
  loadTaskSettings,
  readViewFromUrl,
  saveTaskSettings,
  sortAndFilter,
  taskStorage,
  writeViewToUrl,
} from "@/lib/tasks/storage"
import {
  ALL_BOARD_ID,
  TASK_STATUSES,
  type Task,
  type TaskBoard,
  type TaskCategory,
  type TaskSortBy,
  type TaskStatus,
  type TaskViewMode,
} from "@/lib/tasks/types"

export default function TasksPage() {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [boards, setBoards] = useState<TaskBoard[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all")
  const [sortBy, setSortBy] = useState<TaskSortBy>("created")
  const [viewMode, setViewMode] = useState<TaskViewMode>("list")
  const [boardId, setBoardId] = useState(ALL_BOARD_ID)
  const [mode, setMode] = useState<"view" | "create" | "edit">("view")
  const [notice, setNotice] = useState<string | null>(null)

  function refreshCatalog() {
    setCategories(loadCategories())
    setBoards(loadBoards())
  }

  useEffect(() => {
    if (!isClient) return
    seedCatalogIfEmpty()
    refreshCatalog()
    const seeded = taskStorage.seedDemoIfEmpty()
    setTasks(seeded)
    setSelectedId(seeded[0]?.id ?? null)
    const settings = loadTaskSettings()
    const fromUrl = readViewFromUrl()
    setFilterStatus(settings.filterStatus)
    setSortBy(settings.sortBy)
    setViewMode(fromUrl.viewMode ?? settings.viewMode)
    setBoardId(fromUrl.boardId ?? settings.boardId)
  }, [isClient])

  useEffect(() => {
    if (!isClient) return
    saveTaskSettings({ filterStatus, sortBy, viewMode, boardId })
    writeViewToUrl(viewMode, boardId)
  }, [boardId, filterStatus, isClient, sortBy, viewMode])

  const activeBoard = boards.find((board) => board.id === boardId) ?? boards[0]
  const visible = useMemo(() => {
    const scoped = filterByBoard(tasks, activeBoard)
    return sortAndFilter(scoped, {
      status: viewMode === "kanban" ? "all" : filterStatus,
      searchQuery,
      sortBy,
    })
  }, [activeBoard, filterStatus, searchQuery, sortBy, tasks, viewMode])
  const selected = tasks.find((task) => task.id === selectedId) ?? null

  function persist(next: Task[]) {
    taskStorage.save(next)
    setTasks(next)
  }

  function createTask(values: TaskFormValues) {
    const created = taskStorage.create({
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      deadline: values.deadline,
      checklist: valuesToChecklist(values.checklistTexts),
      botConfig: values.apiKeyName ? { apiKeyName: values.apiKeyName } : undefined,
      categoryId: values.categoryId,
      executorBotId: values.executorBotId,
    })
    setTasks(taskStorage.load())
    setSelectedId(created.id)
    setMode("view")
  }

  function saveEdit(values: TaskFormValues) {
    if (!selected) return
    const updated = taskStorage.update(selected.id, {
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      deadline: values.deadline,
      checklist: valuesToChecklist(values.checklistTexts, selected.checklist),
      botConfig: { ...selected.botConfig, apiKeyName: values.apiKeyName },
      categoryId: values.categoryId,
      executorBotId: values.executorBotId,
    })
    setTasks(taskStorage.load())
    if (updated) setSelectedId(updated.id)
    setMode("view")
  }

  function updateTask(updates: Partial<Task>) {
    if (!selected) return
    const updated = taskStorage.update(selected.id, updates)
    setTasks(taskStorage.load())
    if (updated) setSelectedId(updated.id)
  }

  function moveTask(taskId: string, status: TaskStatus) {
    taskStorage.update(taskId, { status })
    setTasks(taskStorage.load())
  }

  function deleteTask() {
    if (!selected) return
    if (!window.confirm(`Удалить «${selected.title}»?`)) return
    taskStorage.delete(selected.id)
    const next = taskStorage.load()
    persist(next)
    setSelectedId(next[0]?.id ?? null)
    setMode("view")
  }

  function saveMemory() {
    if (!selected) return
    const record = persistTaskMemory(buildTaskMemory(selected, categoryName(categories, selected.categoryId)))
    taskStorage.update(selected.id, { memorySavedAt: record.savedAt, memoryPath: record.path })
    setTasks(taskStorage.load())
    setNotice(`Сохранено в память: ${record.path} (файл скачан, копия в localStorage).`)
  }

  if (!isClient) {
    return (
      <main className="mx-auto max-w-[1440px] px-4 py-8">
        <p className="text-sm text-muted-foreground">Загрузка задач…</p>
      </main>
    )
  }

  const detail = (
    <Card>
      <CardContent>
        {mode === "create" ? (
          <div className="grid gap-4">
            <h2 className="text-lg font-bold">Новая задача</h2>
            <TaskForm
              categories={categories}
              submitLabel="Создать задачу"
              onCancel={() => {
                setMode("view")
                setSelectedId(tasks[0]?.id ?? null)
              }}
              onSubmit={createTask}
            />
          </div>
        ) : null}
        {mode !== "create" && selected ? (
          <TaskDetail
            task={selected}
            categories={categories}
            editing={mode === "edit"}
            notice={notice}
            onEdit={() => setMode("edit")}
            onCancelEdit={() => setMode("view")}
            onDelete={deleteTask}
            onUpdateTask={updateTask}
            onSaveEdit={saveEdit}
            onSaveMemory={saveMemory}
          />
        ) : null}
        {mode === "view" && !selected ? (
          <p className="py-8 text-sm text-muted-foreground">Выберите задачу слева или создайте новую.</p>
        ) : null}
      </CardContent>
    </Card>
  )

  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[28px] leading-tight tracking-tight">Задачи</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Список и канбан по направлениям, вложения и память для ботов. Данные в браузере, без сервера.
          </p>
        </div>
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      <BoardBar
        boards={boards}
        categories={categories}
        activeBoardId={boardId}
        onRefresh={refreshCatalog}
        onSelect={setBoardId}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Поиск по названию и описанию"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <select
          className={FIELD_CLASS}
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value as TaskStatus | "all")}
          aria-label="Фильтр по статусу"
        >
          <option value="all">Все</option>
          {TASK_STATUSES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          className={FIELD_CLASS}
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as TaskSortBy)}
          aria-label="Сортировка"
        >
          <option value="created">Сортировка: создана</option>
          <option value="priority">Сортировка: приоритет</option>
          <option value="status">Сортировка: статус</option>
        </select>
        <Button
          type="button"
          onClick={() => {
            setMode("create")
            setSelectedId(null)
          }}
        >
          <Plus />
          Новая
        </Button>
      </div>

      {viewMode === "kanban" ? (
        <div className="grid gap-4">
          <Card>
            <CardContent className="pt-0">
              <KanbanBoard
                tasks={visible}
                categories={categories}
                selectedTaskId={selected?.id}
                onSelectTask={(task) => {
                  setSelectedId(task.id)
                  setMode("view")
                }}
                onMoveTask={moveTask}
              />
            </CardContent>
          </Card>
          {detail}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <Card>
            <CardContent className="pt-0">
              <TaskList
                tasks={visible}
                categories={categories}
                selectedTaskId={selected?.id}
                onSelectTask={(task) => {
                  setSelectedId(task.id)
                  setMode("view")
                }}
                filterStatus={filterStatus}
                searchQuery={searchQuery}
                sortBy={sortBy}
              />
            </CardContent>
          </Card>
          {detail}
        </div>
      )}
    </main>
  )
}
