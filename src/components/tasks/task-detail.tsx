"use client"

import { Pencil, Trash2 } from "lucide-react"
import { Checklist } from "@/components/tasks/checklist"
import { PriorityBadge } from "@/components/tasks/priority-badge"
import { StatusBadge, statusMeta } from "@/components/tasks/status-badge"
import { TaskChat } from "@/components/tasks/task-chat"
import { TaskForm, type TaskFormValues } from "@/components/tasks/task-form"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TASK_STATUSES, type ChecklistItem, type Task, type TaskStatus } from "@/lib/tasks/types"

export function TaskDetail({
  task,
  editing,
  onEdit,
  onCancelEdit,
  onDelete,
  onUpdateTask,
  onSaveEdit,
}: {
  task: Task
  editing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onUpdateTask: (updates: Partial<Task>) => void
  onSaveEdit: (values: TaskFormValues) => void
}) {
  if (editing) {
    return (
      <div className="grid gap-4">
        <h2 className="text-lg font-bold">Редактирование</h2>
        <TaskForm
          initial={task}
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
            {task.deadline ? (
              <span className="text-xs text-muted-foreground">
                дедлайн {new Date(task.deadline).toLocaleDateString("ru-RU")}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
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

      <label className="grid max-w-xs gap-1">
        <span className="text-xs font-medium text-muted-foreground">Статус</span>
        <select
          className="task-status-transition h-8 rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={task.status}
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

      <TaskChat task={task} onUpdateTask={onUpdateTask} />
    </div>
  )
}
