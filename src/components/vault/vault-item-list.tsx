"use client"

import { KeyRound, NotebookPen, RectangleEllipsis } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { KIND_LABEL, type VaultItem, type VaultItemKind } from "@/lib/vault/types"
import { cn } from "@/lib/utils"

const KIND_ICON = {
  password: RectangleEllipsis,
  key: KeyRound,
  note: NotebookPen,
} as const

type VaultItemListProps = {
  items: VaultItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function VaultItemList({ items, selectedId, onSelect }: VaultItemListProps) {
  if (items.length === 0) {
    return (
      <p className="px-1 py-8 text-sm text-muted-foreground">
        Ничего не найдено. Добавьте пароль, ключ или заметку.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = KIND_ICON[item.kind]
        const selected = item.id === selectedId
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                selected
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {item.title || "Без названия"}
                </span>
                <span className="mt-0.5 block truncate text-xs">
                  {item.username || item.url || KIND_LABEL[item.kind]}
                </span>
              </span>
              <KindBadge kind={item.kind} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function KindBadge({ kind }: { kind: VaultItemKind }) {
  return (
    <Badge variant="outline" className="shrink-0">
      {KIND_LABEL[kind]}
    </Badge>
  )
}
