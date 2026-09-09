"use client"

import { Kanban, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TaskViewMode } from "@/lib/tasks/types"

export function ViewToggle({
  value,
  onChange,
}: {
  value: TaskViewMode
  onChange: (mode: TaskViewMode) => void
}) {
  return (
    <div className="inline-flex rounded-xl border border-input bg-white p-0.5" role="tablist" aria-label="Вид списка">
      <Button
        type="button"
        size="sm"
        variant={value === "list" ? "default" : "ghost"}
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
      >
        <List />
        Список
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "kanban" ? "default" : "ghost"}
        aria-pressed={value === "kanban"}
        onClick={() => onChange("kanban")}
      >
        <Kanban />
        Канбан
      </Button>
    </div>
  )
}
