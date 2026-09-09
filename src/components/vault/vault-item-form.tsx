"use client"

import { useState, type FormEvent } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { generatePassword } from "@/lib/vault/crypto"
import { KIND_LABEL, type VaultItem, type VaultItemKind } from "@/lib/vault/types"
import { cn } from "@/lib/utils"

const KINDS: VaultItemKind[] = ["password", "key", "note"]
const textareaClass =
  "min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

type Draft = {
  kind: VaultItemKind
  title: string
  username: string
  secret: string
  url: string
  notes: string
}

type VaultItemFormProps = {
  initial?: VaultItem | null
  onCancel: () => void
  onSave: (draft: Omit<VaultItem, "id" | "createdAt" | "updatedAt">) => Promise<void>
}

export function VaultItemForm({ initial, onCancel, onSave }: VaultItemFormProps) {
  const [draft, setDraft] = useState<Draft>({
    kind: initial?.kind ?? "password",
    title: initial?.title ?? "",
    username: initial?.username ?? "",
    secret: initial?.secret ?? "",
    url: initial?.url ?? "",
    notes: initial?.notes ?? "",
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function patch(update: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...update }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.title.trim()) {
      setError("Нужно название")
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave({
        kind: draft.kind,
        title: draft.title.trim(),
        username: draft.username.trim() || undefined,
        secret: draft.secret || undefined,
        url: draft.url.trim() || undefined,
        notes: draft.notes.trim() || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить")
      setBusy(false)
    }
  }

  const showSecret = draft.kind !== "note"
  const showUser = draft.kind === "password"

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-wrap gap-1.5">
        {KINDS.map((kind) => (
          <Button
            key={kind}
            type="button"
            size="sm"
            variant={draft.kind === kind ? "default" : "outline"}
            onClick={() => patch({ kind })}
          >
            {KIND_LABEL[kind]}
          </Button>
        ))}
      </div>
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Название</span>
        <Input
          required
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder={draft.kind === "key" ? "OpenAI API" : "YouTube"}
        />
      </label>
      {showUser ? (
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Логин</span>
          <Input
            value={draft.username}
            autoComplete="username"
            onChange={(e) => patch({ username: e.target.value })}
          />
        </label>
      ) : null}
      {showSecret ? (
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {draft.kind === "key" ? "Ключ / токен" : "Пароль"}
          </span>
          <div className="flex gap-2">
            <Input
              className={cn("font-mono")}
              type="text"
              autoComplete="off"
              value={draft.secret}
              onChange={(e) => patch({ secret: e.target.value })}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => patch({ secret: generatePassword(18) })}
            >
              <Sparkles />
              Сгенерировать
            </Button>
          </div>
        </label>
      ) : null}
      {draft.kind !== "note" ? (
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">URL</span>
          <Input
            type="url"
            value={draft.url}
            placeholder="https://"
            onChange={(e) => patch({ url: e.target.value })}
          />
        </label>
      ) : null}
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Заметка</span>
        <textarea
          className={textareaClass}
          value={draft.notes}
          onChange={(e) => patch({ notes: e.target.value })}
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} type="submit">
          {busy ? "Сохранение…" : "Сохранить"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  )
}
