import { AlertTriangle, ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react"
import { TASK_PRIORITIES, type TaskPriority } from "@/lib/tasks/types"
import { cn } from "@/lib/utils"

const ICONS: Record<(typeof TASK_PRIORITIES)[number]["icon"], LucideIcon> = {
  ArrowDown,
  Minus,
  ArrowUp,
  AlertTriangle,
}

const COLOR: Record<(typeof TASK_PRIORITIES)[number]["color"], string> = {
  gray: "bg-[#e8eef2] text-[#5a6570]",
  blue: "bg-[#d7ebf7] text-primary",
  orange: "bg-[#ffe8d6] text-[#c45c12]",
  red: "bg-destructive/10 text-destructive",
}

export function priorityMeta(priority: TaskPriority) {
  return TASK_PRIORITIES.find((item) => item.id === priority) ?? TASK_PRIORITIES[1]
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority
  className?: string
}) {
  const meta = priorityMeta(priority)
  const Icon = ICONS[meta.icon]
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-semibold",
        COLOR[meta.color],
        className
      )}
    >
      <Icon className="size-3" />
      {meta.label}
    </span>
  )
}
