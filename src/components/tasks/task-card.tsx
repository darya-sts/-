import { StatusBadge } from "@/components/tasks/status-badge"
import { PriorityBadge } from "@/components/tasks/priority-badge"
import { checklistStats } from "@/lib/tasks/storage"
import type { Task } from "@/lib/tasks/types"
import { cn } from "@/lib/utils"

export function TaskCard({
  task,
  selected,
  onSelect,
}: {
  task: Task
  selected?: boolean
  onSelect: (task: Task) => void
}) {
  const stats = checklistStats(task.checklist)
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
      </span>
      <span className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Чек-лист {stats.done}/{stats.total || 0}
        </span>
        {task.deadline ? (
          <span>до {new Date(task.deadline).toLocaleDateString("ru-RU")}</span>
        ) : null}
      </span>
    </button>
  )
}
