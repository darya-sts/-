import { TASK_STATUSES, type TaskStatus } from "@/lib/tasks/types"
import { cn } from "@/lib/utils"

const COLOR: Record<(typeof TASK_STATUSES)[number]["color"], string> = {
  gray: "bg-[#e8eef2] text-[#5a6570]",
  blue: "bg-[#d7ebf7] text-primary",
  yellow: "bg-[#fff4d4] text-[#8a6d00]",
  orange: "bg-[#ffe8d6] text-[#c45c12]",
  purple: "bg-[#eadcf8] text-[#6b3fa0]",
  green: "bg-[#e2f3e3] text-mcp",
  red: "bg-destructive/10 text-destructive",
}

export function statusMeta(status: TaskStatus) {
  return TASK_STATUSES.find((item) => item.id === status) ?? TASK_STATUSES[0]
}

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const meta = statusMeta(status)
  return (
    <span
      className={cn(
        "task-status-transition inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold",
        COLOR[meta.color],
        className
      )}
    >
      {meta.label}
    </span>
  )
}
