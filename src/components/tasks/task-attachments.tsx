"use client"

import { useEffect, useState } from "react"
import { FileUp, Link2, Paperclip, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { newId } from "@/lib/tasks/id"
import {
  deleteAttachmentBlob,
  getAttachmentBlob,
  isImageFile,
  isTextFile,
  putAttachmentBlob,
} from "@/lib/tasks/files"
import { MAX_ATTACHMENT_BYTES, type Task, type TaskAttachment } from "@/lib/tasks/types"

export function TaskAttachments({
  task,
  onChange,
}: {
  task: Task
  onChange: (attachments: TaskAttachment[]) => void
}) {
  const items = task.attachments ?? []
  const [link, setLink] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    setError(null)
    const next = [...items]
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError(`«${file.name}» больше 25 МБ`)
        continue
      }
      const id = newId()
      const kind = isImageFile(file) ? "image" : "file"
      let excerpt: string | undefined
      if (isTextFile(file)) excerpt = (await file.text()).slice(0, 4000)
      await putAttachmentBlob(id, file)
      next.push({
        id,
        kind,
        name: file.name,
        mimeType: file.type || undefined,
        size: file.size,
        excerpt,
        createdAt: Date.now(),
      })
    }
    onChange(next)
  }

  async function addLink() {
    const raw = link.trim()
    if (!raw) return
    setBusy(true)
    setError(null)
    try {
      const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
      const parsed = new URL(url)
      let title = parsed.hostname
      try {
        const response = await fetch(url, { mode: "cors" })
        const html = await response.text()
        const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        if (match?.[1]) title = match[1].trim()
      } catch {
        /* CORS is expected for most sites in a static app */
      }
      onChange([
        ...items,
        { id: newId(), kind: "link", name: parsed.hostname, url, title, createdAt: Date.now() },
      ])
      setLink("")
    } catch {
      setError("Некорректный URL")
    } finally {
      setBusy(false)
    }
  }

  async function remove(item: TaskAttachment) {
    if (item.kind !== "link") await deleteAttachmentBlob(item.id)
    onChange(items.filter((entry) => entry.id !== item.id))
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Paperclip className="size-4 text-primary" />
        <p className="text-sm font-semibold">Вложения</p>
      </div>
      <ul className="grid gap-1.5">
        {items.length === 0 ? <li className="text-sm text-muted-foreground">Файлов и ссылок пока нет.</li> : null}
        {items.map((item) => (
          <AttachmentRow key={item.id} item={item} onRemove={() => void remove(item)} />
        ))}
      </ul>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-white/80 px-3 py-2 text-sm">
        <FileUp className="size-4" />
        Файл или изображение (до 25 МБ)
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            void addFiles(event.target.files)
            event.target.value = ""
          }}
        />
      </label>
      <div className="flex gap-2">
        <Input
          value={link}
          placeholder="https://ссылка"
          onChange={(event) => setLink(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              void addLink()
            }
          }}
        />
        <Button type="button" variant="outline" disabled={busy} onClick={() => void addLink()}>
          <Link2 />
          Ссылка
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

function AttachmentRow({ item, onRemove }: { item: TaskAttachment; onRemove: () => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  useEffect(() => {
    if (item.kind !== "image") return
    let objectUrl = ""
    let cancelled = false
    void getAttachmentBlob(item.id).then((blob) => {
      if (!blob || cancelled) return
      objectUrl = URL.createObjectURL(blob)
      setPreview(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [item.id, item.kind])

  async function openFile() {
    if (item.kind === "link" && item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer")
      return
    }
    const blob = await getAttachmentBlob(item.id)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = item.name
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <li className="flex items-start gap-2 rounded-lg bg-white/80 px-2 py-1.5">
      {preview ? <img src={preview} alt="" className="size-10 rounded object-cover" /> : <Paperclip className="mt-1 size-4 shrink-0" />}
      <button type="button" className="min-w-0 flex-1 text-left text-sm" onClick={() => void openFile()}>
        <span className="block truncate font-medium">{item.title || item.name}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {item.kind === "link" ? item.url : item.mimeType || item.kind}
        </span>
      </button>
      <Button type="button" size="icon-xs" variant="ghost" aria-label="Удалить вложение" onClick={onRemove}>
        <Trash2 />
      </Button>
    </li>
  )
}
