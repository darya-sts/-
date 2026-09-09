"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { checklistStats, newId } from "@/lib/tasks/storage"
import type { ChecklistItem } from "@/lib/tasks/types"

export interface ChecklistProps {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
  readOnly?: boolean
}

export function Checklist({ items, onChange, readOnly }: ChecklistProps) {
  const [draft, setDraft] = useState("")
  const stats = checklistStats(items)

  function toggle(id: string, completed: boolean) {
    if (readOnly) return
    onChange(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              completed,
              completedAt: completed ? Date.now() : undefined,
              completedBy: completed ? "user" : undefined,
            }
          : item
      )
    )
  }

  function remove(id: string) {
    if (readOnly) return
    onChange(items.filter((item) => item.id !== id))
  }

  function add() {
    const text = draft.trim()
    if (!text) return
    onChange([...items, { id: newId(), text, completed: false }])
    setDraft("")
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          Чек-лист ({stats.done}/{stats.total})
        </p>
        <span className="text-xs text-muted-foreground tabular-nums">{stats.percent}%</span>
      </div>
      <Progress value={stats.percent} className="gap-0" />
      <ul className="grid gap-1.5">
        {items.length === 0 ? (
          <li className="text-sm text-muted-foreground">Пунктов пока нет.</li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2 rounded-lg bg-white/80 px-2 py-1.5"
            >
              <Checkbox
                checked={item.completed}
                disabled={readOnly}
                onCheckedChange={(checked) => toggle(item.id, checked === true)}
                className="mt-0.5"
              />
              <span className="min-w-0 flex-1">
                <span
                  className={
                    item.completed
                      ? "text-sm text-muted-foreground line-through"
                      : "text-sm text-foreground"
                  }
                >
                  {item.text}
                </span>
                {item.completedBy ? (
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {item.completedBy === "bot" ? "закрыл бот" : "закрыли вы"}
                  </span>
                ) : null}
              </span>
              {readOnly ? null : (
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Удалить пункт"
                  onClick={() => remove(item.id)}
                >
                  <Trash2 />
                </Button>
              )}
            </li>
          ))
        )}
      </ul>
      {readOnly ? null : (
        <div className="flex gap-2">
          <Input
            value={draft}
            placeholder="Новый пункт чек-листа"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                add()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={add}>
            <Plus />
            Добавить
          </Button>
        </div>
      )}
    </div>
  )
}
