"use client"

import { useState } from "react"
import { Plus, Settings2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FIELD_CLASS } from "@/components/tasks/field-styles"
import {
  createBoard,
  createCategory,
  deleteBoard,
  deleteCategory,
  renameCategory,
} from "@/lib/tasks/catalog"
import { ALL_BOARD_ID, NONE_BOARD_ID, type TaskBoard, type TaskCategory } from "@/lib/tasks/types"
import { cn } from "@/lib/utils"

export function BoardBar({
  boards,
  categories,
  activeBoardId,
  onRefresh,
  onSelect,
}: {
  boards: TaskBoard[]
  categories: TaskCategory[]
  activeBoardId: string
  onRefresh: () => void
  onSelect: (id: string) => void
}) {
  const [panel, setPanel] = useState<"none" | "board" | "cats">("none")
  const [boardName, setBoardName] = useState("")
  const [boardCategory, setBoardCategory] = useState<string>("new")
  const [newCategory, setNewCategory] = useState("")

  function submitBoard() {
    const name = boardName.trim()
    if (!name) return
    let categoryId: string | null = boardCategory
    if (boardCategory === "new") {
      const created = createCategory(newCategory.trim() || name)
      categoryId = created.id
    } else if (boardCategory === "none") {
      categoryId = "none"
    }
    const board = createBoard(name, categoryId)
    setBoardName("")
    setNewCategory("")
    setPanel("none")
    onRefresh()
    onSelect(board.id)
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {boards.map((board) => (
          <button
            key={board.id}
            type="button"
            onClick={() => onSelect(board.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              board.id === activeBoardId ? "bg-primary text-primary-foreground" : "bg-white text-foreground hover:bg-white/80"
            )}
          >
            {board.name}
          </button>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={() => setPanel(panel === "board" ? "none" : "board")}>
          <Plus />
          Канбан
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setPanel(panel === "cats" ? "none" : "cats")}>
          <Settings2 />
          Категории
        </Button>
      </div>

      {panel === "board" ? (
        <div className="grid gap-2 rounded-xl bg-white/80 p-3 sm:grid-cols-[1fr_12rem_1fr_auto]">
          <Input value={boardName} placeholder="Название канбана" onChange={(event) => setBoardName(event.target.value)} />
          <select
            className={FIELD_CLASS}
            value={boardCategory}
            onChange={(event) => setBoardCategory(event.target.value)}
            aria-label="Категория канбана"
          >
            <option value="new">Новая категория</option>
            <option value="none">Без категории</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {boardCategory === "new" ? (
            <Input
              value={newCategory}
              placeholder="Имя категории"
              onChange={(event) => setNewCategory(event.target.value)}
            />
          ) : (
            <span className="self-center text-xs text-muted-foreground">Колонки — общие статусы задач</span>
          )}
          <Button type="button" onClick={submitBoard}>
            Создать
          </Button>
        </div>
      ) : null}

      {panel === "cats" ? (
        <ul className="grid gap-1.5 rounded-xl bg-white/80 p-3">
          {categories.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <Input
                defaultValue={item.name}
                onBlur={(event) => {
                  const value = event.target.value.trim()
                  if (value && value !== item.name) {
                    renameCategory(item.id, value)
                    onRefresh()
                  }
                }}
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={`Удалить ${item.name}`}
                onClick={() => {
                  if (!window.confirm(`Удалить категорию «${item.name}»?`)) return
                  deleteCategory(item.id)
                  onRefresh()
                }}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
          {categories.length === 0 ? <li className="text-sm text-muted-foreground">Категорий нет.</li> : null}
        </ul>
      ) : null}

      {boards
        .filter((board) => board.id !== ALL_BOARD_ID && board.id !== NONE_BOARD_ID && board.id === activeBoardId)
        .map((board) => (
          <div key={board.id} className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                if (!window.confirm(`Удалить канбан «${board.name}»?`)) return
                deleteBoard(board.id)
                onRefresh()
                onSelect(ALL_BOARD_ID)
              }}
            >
              Удалить этот канбан
            </Button>
          </div>
        ))}
    </div>
  )
}
