"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Download, Lock, Plus, Search, Upload } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { decryptItems, encryptItems } from "@/lib/vault/crypto"
import {
  clearVaultSession,
  hasVault,
  loadVaultBlob,
  markSessionUnlocked,
  parseImportedVault,
  saveVaultBlob,
} from "@/lib/vault/storage"
import type { VaultItem } from "@/lib/vault/types"
import { VaultItemForm } from "./vault-item-form"
import { VaultItemList } from "./vault-item-list"
import { VaultItemView } from "./vault-item-view"
import { VaultLogin } from "./vault-login"

type Panel = "view" | "create" | "edit"

export function VaultPage() {
  const passwordRef = useRef("")
  const importRef = useRef<HTMLInputElement>(null)
  const [ready, setReady] = useState(false)
  const [exists, setExists] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<VaultItem[]>([])
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel>("view")

  useEffect(() => {
    setExists(hasVault())
    setReady(true)
  }, [])

  const persist = useCallback(async (next: VaultItem[]) => {
    const password = passwordRef.current
    if (!password) throw new Error("Сейф заблокирован")
    const blob = await encryptItems(next, password)
    saveVaultBlob(blob)
    setItems(next)
    setExists(true)
  }, [])

  const unlock = useCallback(async (password: string) => {
    setBusy(true)
    setError(null)
    try {
      const blob = loadVaultBlob()
      if (!blob) {
        saveVaultBlob(await encryptItems([], password))
        setItems([])
      } else {
        setItems(await decryptItems(blob, password))
      }
      passwordRef.current = password
      markSessionUnlocked()
      setExists(true)
      setUnlocked(true)
    } catch {
      setError("Неверный мастер-пароль или повреждённый сейф")
    } finally {
      setBusy(false)
    }
  }, [])

  const lock = useCallback(() => {
    passwordRef.current = ""
    setItems([])
    setSelectedId(null)
    setPanel("view")
    setQuery("")
    setUnlocked(false)
    setError(null)
    clearVaultSession()
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = needle
      ? items.filter((item) => {
          const hay = [item.title, item.username, item.url, item.notes, item.kind]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          return hay.includes(needle)
        })
      : items
    return [...list].sort((a, b) => a.title.localeCompare(b.title, "ru"))
  }, [items, query])

  const selected = items.find((item) => item.id === selectedId) ?? null

  const saveItem = useCallback(
    async (draft: Omit<VaultItem, "id" | "createdAt" | "updatedAt">, id?: string) => {
      const now = new Date().toISOString()
      let next: VaultItem[]
      if (id) {
        next = items.map((item) =>
          item.id === id ? { ...item, ...draft, updatedAt: now } : item
        )
      } else {
        const created: VaultItem = {
          ...draft,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        }
        next = [...items, created]
        setSelectedId(created.id)
      }
      await persist(next)
      setPanel("view")
    },
    [items, persist]
  )

  const deleteSelected = useCallback(async () => {
    if (!selected) return
    if (!window.confirm(`Удалить «${selected.title}»?`)) return
    const next = items.filter((item) => item.id !== selected.id)
    await persist(next)
    setSelectedId(next[0]?.id ?? null)
    setPanel("view")
  }, [items, persist, selected])

  const exportVault = useCallback(() => {
    const blob = loadVaultBlob()
    if (!blob) return
    const file = new Blob([JSON.stringify(blob, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(file)
    const link = document.createElement("a")
    link.href = url
    link.download = "forge-mill-vault.json"
    link.click()
    URL.revokeObjectURL(url)
  }, [])

  const importVault = useCallback(async (file: File) => {
    setError(null)
    try {
      const parsed = parseImportedVault(await file.text())
      saveVaultBlob(parsed)
      lock()
      setExists(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось импортировать файл")
    }
  }, [lock])

  if (!ready) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <p className="text-sm text-muted-foreground">Загрузка сейфа…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader
        kicker="Локальный сейф"
        title="Password Vault"
        description="Пароли, ключи и заметки шифруются AES-256-GCM в браузере и лежат только в localStorage. Мастер-пароль никуда не сохраняется."
      />

      {!unlocked ? (
        <VaultLogin
          mode={exists ? "unlock" : "setup"}
          busy={busy}
          error={error}
          onSubmit={unlock}
        />
      ) : (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Поиск по названию, логину, URL…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button type="button" onClick={() => setPanel("create")}>
              <Plus />
              Добавить
            </Button>
            <Button type="button" variant="outline" onClick={exportVault}>
              <Download />
              Экспорт
            </Button>
            <Button type="button" variant="outline" onClick={() => importRef.current?.click()}>
              <Upload />
              Импорт
            </Button>
            <Button type="button" variant="ghost" onClick={lock}>
              <Lock />
              Заблокировать
            </Button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (file) void importVault(file)
              }}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
            <Card>
              <CardContent className="pt-0">
                <VaultItemList
                  items={filtered}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id)
                    setPanel("view")
                  }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                {panel === "create" ? (
                  <VaultItemForm
                    onCancel={() => setPanel("view")}
                    onSave={(draft) => saveItem(draft)}
                  />
                ) : null}
                {panel === "edit" && selected ? (
                  <VaultItemForm
                    initial={selected}
                    onCancel={() => setPanel("view")}
                    onSave={(draft) => saveItem(draft, selected.id)}
                  />
                ) : null}
                {panel === "view" && selected ? (
                  <VaultItemView
                    item={selected}
                    onEdit={() => setPanel("edit")}
                    onDelete={() => void deleteSelected()}
                  />
                ) : null}
                {panel === "view" && !selected ? (
                  <p className="py-8 text-sm text-muted-foreground">
                    Выберите запись слева или добавьте новую.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  )
}
