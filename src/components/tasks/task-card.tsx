import { Bot, Paperclip } from "lucide-react"
import { StatusBadge } from "@/components/tasks/status-badge"
import { PriorityBadge } from "@/components/tasks/priority-badge"
import { checklistStats } from "@/lib/tasks/storage"
import type { Task } from "@/lib/tasks/types"
import { cn } from "@/lib/utils"

export function TaskCard({
  task,
  selected,
  onSelect,
  categoryLabel,
  botName,
}: {
  task: Task
  selected?: boolean
  onSelect: (task: Task) => void
  categoryLabel?: string
  botName?: string
}) {
  const stats = checklistStats(task.checklist)
  const images = (task.attachments ?? []).filter((item) => item.kind === "image")
  const files = task.attachments?.length ?? 0
  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      className={cn(
        "task-status-transition flex w-full flex-col gap-2 rounded-xl border px-3 py-2.5 text-left",
        selected
          ? "border-primary bg-white shadow-[inset_3px_0_0_var(--primary)]"
          : "border-transparent bg-white/70 hover:border-border hover:bg-white"
      )}
      data-testid="task-card"
    >
      <span className="line-clamp-2 text-sm font-semibold text-foreground">{task.title}</span>
      <span className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
        {categoryLabel ? (
          <span className="inline-flex h-5 items-center rounded-full bg-[#e8eef2] px-2 text-[11px] font-semibold text-[#5a6570]">
            {categoryLabel}
          </span>
        ) : null}
      </span>
      {botName && botName !== "Не назначен" ? (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Bot className="size-3" />
          {botName}
        </span>
      ) : null}
      {images.length > 0 ? (
        <span className="text-[11px] text-muted-foreground">Изображения: {images.length}</span>
      ) : null}
      <span className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Чек-лист {stats.done}/{stats.total || 0}
        </span>
        <span className="flex items-center gap-2">
          {files > 0 ? (
            <span className="inline-flex items-center gap-0.5">
              <Paperclip className="size-3" />
              {files}
            </span>
          ) : null}
          {task.deadline ? <span>до {new Date(task.deadline).toLocaleDateString("ru-RU")}</span> : null}
        </span>
      </span>
    </button>
  )
}
