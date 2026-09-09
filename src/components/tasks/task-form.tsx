"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskPriority, type TaskStatus } from "@/lib/tasks/types"
import { newId } from "@/lib/tasks/storage"

const fieldClass =
  "h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
const textareaClass =
  "min-h-24 w-full rounded-lg border border-input bg-white px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export type TaskFormValues = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  deadline?: number
  checklistTexts: string[]
  apiKeyName?: string
}

export function TaskForm({
  initial,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initial?: Task | null
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
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      deadline: fromDateInput(deadline),
      checklistTexts,
      apiKeyName: apiKeyName.trim() || undefined,
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
          className={textareaClass}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Контекст, критерии готовности"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted-foreground">Статус</span>
          <select className={fieldClass} value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
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
            className={fieldClass}
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
          className={textareaClass}
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
