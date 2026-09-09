"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FIELD_CLASS, TEXTAREA_CLASS } from "@/components/tasks/field-styles"
import { PROJECT_BOTS } from "@/lib/tasks/bots"
import { newId } from "@/lib/tasks/id"
import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskCategory, type TaskPriority, type TaskStatus } from "@/lib/tasks/types"

export type TaskFormValues = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  deadline?: number
  checklistTexts: string[]
  apiKeyName?: string
  categoryId: string | null
  executorBotId?: string
}

export function TaskForm({
  initial,
  categories,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initial?: Task | null
  categories: TaskCategory[]
  submitLabel: string
  onCancel: () => void
  onSubmit: (values: TaskFormValues) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "new")
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "medium")
  const [deadline, setDeadline] = useState(toDateInput(initial?.deadline))
  const [apiKeyName, setApiKeyName] = useState(initial?.botConfig?.apiKeyName ?? "")
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "")
  const [executorBotId, setExecutorBotId] = useState(initial?.executorBotId ?? "task-bot")
  const [customBot, setCustomBot] = useState(
    initial?.executorBotId?.startsWith("custom:") ? initial.executorBotId.slice(7) : ""
  )
  const [checklistText, setChecklistText] = useState(
    (initial?.checklist ?? []).map((item) => item.text).join("\n")
  )
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      setError("Нужно название задачи")
      return
    }
    const checklistTexts = checklistText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
    const botId =
      executorBotId === "custom" ? (customBot.trim() ? `custom:${customBot.trim()}` : undefined) : executorBotId || undefined
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      deadline: fromDateInput(deadline),
      checklistTexts,
      apiKeyName: apiKeyName.trim() || undefined,
      categoryId: categoryId || null,
      executorBotId: botId,
    })
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <label className="grid gap-1">
        <span className="text-xs font-medium text-muted-foreground">Название</span>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Что нужно сделать" />
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-medium text-muted-foreground">Описание</span>
        <textarea
          className={TEXTAREA_CLASS}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Контекст, критерии готовности"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted-foreground">Статус</span>
          <select className={`${FIELD_CLASS} w-full`} value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
            {TASK_STATUSES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted-foreground">Приоритет</span>
          <select
            className={`${FIELD_CLASS} w-full`}
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
          >
            {TASK_PRIORITIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted-foreground">Категория (направление)</span>
          <select
            className={`${FIELD_CLASS} w-full`}
            value={categoryId}
            aria-label="Категория задачи"
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Без категории</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted-foreground">Бот-исполнитель</span>
          <select
            className={`${FIELD_CLASS} w-full`}
            value={executorBotId.startsWith("custom:") ? "custom" : executorBotId}
            aria-label="Бот-исполнитель"
            onChange={(event) => setExecutorBotId(event.target.value)}
          >
            {PROJECT_BOTS.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
            <option value="custom">Другой (вручную)</option>
          </select>
        </label>
      </div>
      {executorBotId === "custom" || executorBotId.startsWith("custom:") ? (
        <Input value={customBot} placeholder="Имя бота" onChange={(event) => setCustomBot(event.target.value)} />
      ) : null}
      <label className="grid gap-1">
        <span className="text-xs font-medium text-muted-foreground">Дедлайн</span>
        <Input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-medium text-muted-foreground">Ключ из Базы паролей</span>
        <Input
          value={apiKeyName}
          onChange={(event) => setApiKeyName(event.target.value)}
          placeholder="Название записи kind=ключ"
        />
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-medium text-muted-foreground">Чек-лист (по одному пункту на строку)</span>
        <textarea
          className={TEXTAREA_CLASS}
          value={checklistText}
          onChange={(event) => setChecklistText(event.target.value)}
          placeholder={"Дизайн макета\nВерстка\nАнимации"}
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit">{submitLabel}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  )
}

export function valuesToChecklist(texts: string[], previous?: Task["checklist"]) {
  return texts.map((text, index) => {
    const existing = previous?.[index]
    if (existing && existing.text === text) return existing
    return { id: existing?.id ?? newId(), text, completed: false }
  })
}

function toDateInput(value?: number) {
  if (!value) return ""
  const date = new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function fromDateInput(value: string) {
  if (!value) return undefined
  const parsed = Date.parse(`${value}T12:00:00`)
  return Number.isNaN(parsed) ? undefined : parsed
}
