"use client"

import { useState } from "react"
import { Copy, Eye, EyeOff, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { KIND_LABEL, type VaultItem } from "@/lib/vault/types"

type VaultItemViewProps = {
  item: VaultItem
  onEdit: () => void
  onDelete: () => void
}

export function VaultItemView({ item, onEdit, onDelete }: VaultItemViewProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(label: string, value?: string) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied((current) => (current === label ? null : current)), 1400)
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl tracking-tight">{item.title}</h2>
            <Badge variant="secondary">{KIND_LABEL[item.kind]}</Badge>
          </div>
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              {item.url}
            </a>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onEdit}>
            <Pencil />
            Изменить
          </Button>
          <Button type="button" variant="destructive" onClick={onDelete}>
            <Trash2 />
            Удалить
          </Button>
        </div>
      </div>

      {item.username ? (
        <Field
          label="Логин"
          value={item.username}
          copied={copied === "username"}
          onCopy={() => copy("username", item.username)}
        />
      ) : null}

      {item.secret ? (
        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {item.kind === "key" ? "Ключ" : "Пароль"}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2.5 py-1.5 font-mono text-sm">
              {revealed ? item.secret : "•".repeat(Math.min(18, item.secret.length || 8))}
            </code>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => setRevealed((v) => !v)}
            >
              {revealed ? <EyeOff /> : <Eye />}
              <span className="sr-only">{revealed ? "Скрыть" : "Показать"}</span>
            </Button>
            <Button type="button" size="icon" variant="outline" onClick={() => copy("secret", item.secret)}>
              <Copy />
              <span className="sr-only">Копировать</span>
            </Button>
            {copied === "secret" ? (
              <span className="text-xs text-muted-foreground">Скопировано</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {item.notes ? (
        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Заметка</span>
          <p className="whitespace-pre-wrap rounded-lg bg-muted px-2.5 py-2 text-sm leading-relaxed">
            {item.notes}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function Field({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm">{value}</span>
        <Button type="button" size="icon-sm" variant="outline" onClick={onCopy}>
          <Copy />
          <span className="sr-only">Копировать {label}</span>
        </Button>
        {copied ? <span className="text-xs text-muted-foreground">Скопировано</span> : null}
      </div>
    </div>
  )
}
