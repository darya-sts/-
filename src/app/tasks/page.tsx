"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { Plus, Search } from "lucide-react"
import { TaskDetail } from "@/components/tasks/task-detail"
import { TaskForm, valuesToChecklist, type TaskFormValues } from "@/components/tasks/task-form"
import { TaskList } from "@/components/tasks/task-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  loadTaskSettings,
  saveTaskSettings,
  sortAndFilter,
  taskStorage,
} from "@/lib/tasks/storage"
import { TASK_STATUSES, type Task, type TaskSortBy, type TaskStatus } from "@/lib/tasks/types"

const fieldClass =
  "h-8 rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export default function TasksPage() {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all")
  const [sortBy, setSortBy] = useState<TaskSortBy>("created")
  const [mode, setMode] = useState<"view" | "create" | "edit">("view")

  useEffect(() => {
    if (!isClient) return
    const seeded = taskStorage.seedDemoIfEmpty()
    setTasks(seeded)
    setSelectedId(seeded[0]?.id ?? null)
    const settings = loadTaskSettings()
    setFilterStatus(settings.filterStatus)
    setSortBy(settings.sortBy)
  }, [isClient])

  useEffect(() => {
    if (!isClient) return
    saveTaskSettings({ filterStatus, sortBy })
  }, [filterStatus, isClient, sortBy])

  const visible = useMemo(
    () => sortAndFilter(tasks, { status: filterStatus, searchQuery, sortBy }),
    [filterStatus, searchQuery, sortBy, tasks]
  )
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

  function deleteTask() {
    if (!selected) return
    if (!window.confirm(`Удалить «${selected.title}»?`)) return
    taskStorage.delete(selected.id)
    const next = taskStorage.load()
    persist(next)
    setSelectedId(next[0]?.id ?? null)
    setMode("view")
  }

  if (!isClient) {
    return (
      <main className="mx-auto max-w-[1280px] px-4 py-8">
        <p className="text-sm text-muted-foreground">Загрузка задач…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-tight tracking-tight">Задачи</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Чек-листы, статусы и локальный ИИ-агент. Данные лежат в localStorage, ключи бота — в Базе
          паролей.
        </p>
      </div>

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
          className={fieldClass}
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
          className={fieldClass}
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <Card>
          <CardContent className="pt-0">
            <TaskList
              tasks={visible}
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
        <Card>
          <CardContent>
            {mode === "create" ? (
              <div className="grid gap-4">
                <h2 className="text-lg font-bold">Новая задача</h2>
                <TaskForm
                  submitLabel="Создать"
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
                editing={mode === "edit"}
                onEdit={() => setMode("edit")}
                onCancelEdit={() => setMode("view")}
                onDelete={deleteTask}
                onUpdateTask={updateTask}
                onSaveEdit={saveEdit}
              />
            ) : null}
            {mode === "view" && !selected ? (
              <p className="py-8 text-sm text-muted-foreground">
                Выберите задачу слева или создайте новую.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
