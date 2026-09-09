"use client"

import { Brain, Pencil, Trash2 } from "lucide-react"
import { Checklist } from "@/components/tasks/checklist"
import { PriorityBadge } from "@/components/tasks/priority-badge"
import { StatusBadge, statusMeta } from "@/components/tasks/status-badge"
import { TaskAttachments } from "@/components/tasks/task-attachments"
import { TaskChat } from "@/components/tasks/task-chat"
import { TaskForm, type TaskFormValues } from "@/components/tasks/task-form"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { botLabel } from "@/lib/tasks/bots"
import { categoryName } from "@/lib/tasks/catalog"
import { TASK_STATUSES, type ChecklistItem, type Task, type TaskAttachment, type TaskCategory, type TaskStatus } from "@/lib/tasks/types"

export function TaskDetail({
  task,
  categories,
  editing,
  notice,
  onEdit,
  onCancelEdit,
  onDelete,
  onUpdateTask,
  onSaveEdit,
  onSaveMemory,
}: {
  task: Task
  categories: TaskCategory[]
  editing: boolean
  notice?: string | null
  onEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onUpdateTask: (updates: Partial<Task>) => void
  onSaveEdit: (values: TaskFormValues) => void
  onSaveMemory: () => void
}) {
  if (editing) {
    return (
      <div className="grid gap-4">
        <h2 className="text-lg font-bold">Редактирование</h2>
        <TaskForm
          initial={task}
          categories={categories}
          submitLabel="Сохранить"
          onCancel={onCancelEdit}
          onSubmit={onSaveEdit}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-balance">{task.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <span className="inline-flex h-5 items-center rounded-full bg-[#e8eef2] px-2 text-[11px] font-semibold text-[#5a6570]">
              {categoryName(categories, task.categoryId)}
            </span>
            <span className="text-xs text-muted-foreground">исполнитель: {botLabel(task.executorBotId)}</span>
            {task.deadline ? (
              <span className="text-xs text-muted-foreground">
                дедлайн {new Date(task.deadline).toLocaleDateString("ru-RU")}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onSaveMemory}>
            <Brain />
            Сохранить в память
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onEdit}>
            <Pencil />
            Изменить
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 />
            Удалить
          </Button>
        </div>
      </div>
      {notice ? <p className="rounded-lg bg-[#e2f3e3] px-3 py-2 text-sm text-mcp">{notice}</p> : null}

      <label className="grid max-w-xs gap-1">
        <span className="text-xs font-medium text-muted-foreground">Статус</span>
        <select
          className="task-status-transition h-8 rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={task.status}
          aria-label="Статус задачи"
          onChange={(event) => onUpdateTask({ status: event.target.value as TaskStatus })}
        >
          {TASK_STATUSES.map((item) => (
            <option key={item.id} value={item.id}>
              {statusMeta(item.id).label}
            </option>
          ))}
        </select>
      </label>

      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Описание</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
          {task.description || "Описание не задано."}
        </p>
      </div>

      <Separator />
      <Checklist items={task.checklist} onChange={(items: ChecklistItem[]) => onUpdateTask({ checklist: items })} />
      <Separator />
      <TaskAttachments
        task={task}
        onChange={(attachments: TaskAttachment[]) => onUpdateTask({ attachments })}
      />
      <Separator />
      <TaskChat task={task} onUpdateTask={onUpdateTask} />
    </div>
  )
}
